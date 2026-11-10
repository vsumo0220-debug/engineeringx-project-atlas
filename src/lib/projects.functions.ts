import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { projectInputSchema, projectUpdateSchema, siteSettingsSchema } from "./project-schema";
import { DEFAULT_DISCORD_URL } from "./site";

export const PROJECT_IMAGES_BUCKET = "project-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365;

export type Project = {
  id: string;
  title: string;
  short_description: string;
  full_description: string;
  image_path: string;
  image_src: string;
  youtube_url: string | null;
  github_url: string | null;
  created_at: string;
  updated_at: string;
};

type Db = SupabaseClient<Database>;
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

const getPublicClient = createServerOnlyFn((): Db => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("The database connection is not configured.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
});

/** Signed URLs are built against the browser-reachable backend URL. */
function toBrowserUrl(signedUrl: string): string {
  const idx = signedUrl.indexOf("/storage/v1/");
  const base = (import.meta.env['VITE_SUPABASE_URL'] ?? "").replace(/\/+$/, "");
  return idx >= 0 && base ? base + signedUrl.slice(idx) : signedUrl;
}

async function withImages(client: Db, rows: ProjectRow[]): Promise<Project[]> {
  if (rows.length === 0) return [];
  const { data } = await client.storage
    .from(PROJECT_IMAGES_BUCKET)
    .createSignedUrls(
      rows.map((r) => r.image_url),
      SIGNED_URL_TTL_SECONDS,
    );
  const byPath = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) byPath.set(item.path, toBrowserUrl(item.signedUrl));
  }
  return rows.map(({ image_url, ...rest }) => ({
    ...rest,
    image_path: image_url,
    image_src: byPath.get(image_url) ?? "",
  }));
}

async function assertAdmin(supabase: Db, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || data !== true) {
    throw new Error("Forbidden: administrator access is required.");
  }
}

/* ---------- Public reads ---------- */

export const listProjects = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number | undefined } | undefined) =>
    z.object({ limit: z.number().int().min(1).max(100).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const client = getPublicClient();
    let query = client.from("projects").select("*").order("created_at", { ascending: false });
    if (data.limit) query = query.limit(data.limit);
    const { data: rows, error } = await query;
    if (error) throw new Error("Could not load projects.");
    return withImages(client, rows ?? []);
  });

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const client = getPublicClient();
    const { data: row, error } = await client.from("projects").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error("Could not load this project.");
    if (!row) return null;
    const [project] = await withImages(client, [row]);
    return project ?? null;
  });

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const client = getPublicClient();
  const { data } = await client.from("site_settings").select("discord_url").eq("id", 1).maybeSingle();
  return { discord_url: data?.discord_url || DEFAULT_DISCORD_URL };
});

/* ---------- Admin writes (authenticated + admin role, enforced again by RLS) ---------- */

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => projectInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { image_path, ...rest } = data;
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({ ...rest, image_url: image_path })
      .select("id")
      .single();
    if (error) throw new Error("Could not publish the project. Please try again.");
    return { id: row.id };
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => projectUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, image_path, ...rest } = data;
    const { data: existing } = await context.supabase
      .from("projects")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();
    if (!existing) throw new Error("This project no longer exists.");

    const { error } = await context.supabase
      .from("projects")
      .update({ ...rest, image_url: image_path })
      .eq("id", id);
    if (error) throw new Error("Could not save changes. Please try again.");

    if (existing.image_url !== image_path) {
      await context.supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([existing.image_url]);
    }
    return { id };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: existing } = await context.supabase
      .from("projects")
      .select("image_url")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete the project. Please try again.");
    if (existing?.image_url) {
      await context.supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([existing.image_url]);
    }
    return { ok: true };
  });

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => siteSettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("site_settings")
      .update({ discord_url: data.discord_url })
      .eq("id", 1);
    if (error) throw new Error("Could not save settings. Please try again.");
    return { ok: true };
  });
