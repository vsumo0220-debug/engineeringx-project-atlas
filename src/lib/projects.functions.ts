import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { projectInputSchema, projectUpdateSchema, siteSettingsSchema } from "./project-schema";
import { DEFAULT_DISCORD_URL } from "./site";
import { assertAdmin, getPublicClient, removeMedia, signPaths } from "./backend";

export { MEDIA_BUCKET as PROJECT_IMAGES_BUCKET } from "./backend";

export type ProjectImage = { path: string; src: string };

export type Project = {
  id: string;
  title: string;
  short_description: string;
  full_description: string;
  category: string | null;
  status: string;
  team: string | null;
  technologies: string[];
  /** Ordered gallery; images[0] is the main image. */
  images: ProjectImage[];
  image_src: string;
  youtube_url: string | null;
  demo_url: string | null;
  github_url: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

function galleryPaths(row: ProjectRow): string[] {
  return row.images.length > 0 ? row.images : row.image_url ? [row.image_url] : [];
}

async function withImages(rows: ProjectRow[]): Promise<Project[]> {
  if (rows.length === 0) return [];
  const urls = await signPaths(rows.flatMap(galleryPaths));
  return rows.map((row) => {
    const { image_url: _main, images: _paths, ...rest } = row;
    const images = galleryPaths(row).map((path) => ({ path, src: urls.get(path) ?? "" }));
    return { ...rest, images, image_src: images[0]?.src ?? "" };
  });
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
    return withImages(rows ?? []);
  });

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const client = getPublicClient();
    const { data: row, error } = await client.from("projects").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error("Could not load this project.");
    if (!row) return null;
    const [project] = await withImages([row]);
    return project ?? null;
  });

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const client = getPublicClient();
  const { data: rows } = await client.rpc("get_public_site_settings");
  const data = rows?.[0];
  return {
    discord_url: data?.discord_url || DEFAULT_DISCORD_URL,
    active_members: data?.active_members ?? null,
  };
});

export type ImpactStats = {
  activeMembers: number | null;
  completedProjects: number;
  inDevelopment: number;
  fieldsExplored: number;
};

/** Every number comes from real data: project statuses/categories and the admin-entered member count. */
export const getImpactStats = createServerFn({ method: "GET" }).handler(async (): Promise<ImpactStats> => {
  const client = getPublicClient();
  const [{ data: rows, error }, { data: settings }] = await Promise.all([
    client.from("projects").select("status, category"),
    client.rpc("get_public_site_settings"),
  ]);
  if (error) throw new Error("Could not load statistics.");
  const list = rows ?? [];
  const fields = new Set(list.map((r) => r.category?.trim().toLowerCase()).filter(Boolean));
  return {
    activeMembers: settings?.[0]?.active_members ?? null,
    completedProjects: list.filter((r) => r.status === "completed").length,
    inDevelopment: list.filter((r) => r.status === "in_progress").length,
    fieldsExplored: fields.size,
  };
});

/* ---------- Admin writes (authenticated + admin role, enforced again by RLS) ---------- */

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => projectInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({ ...data, image_url: data.images[0]! })
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
    const { id, ...rest } = data;
    const { data: existing } = await context.supabase
      .from("projects")
      .select("image_url, images")
      .eq("id", id)
      .maybeSingle();
    if (!existing) throw new Error("This project no longer exists.");

    const { error } = await context.supabase
      .from("projects")
      .update({ ...rest, image_url: rest.images[0]! })
      .eq("id", id);
    if (error) throw new Error("Could not save changes. Please try again.");

    const keep = new Set(rest.images);
    const old = new Set([existing.image_url, ...existing.images]);
    await removeMedia(
      context.supabase,
      [...old].filter((p) => !keep.has(p)),
    );
    return { id };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: existing } = await context.supabase
      .from("projects")
      .select("image_url, images")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete the project. Please try again.");
    if (existing) await removeMedia(context.supabase, [...new Set([existing.image_url, ...existing.images])]);
    return { ok: true };
  });

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => siteSettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("site_settings")
      .update({
        discord_url: data.discord_url,
        active_members: data.active_members,
        contact_email: data.contact_email,
      })
      .eq("id", 1);
    if (error) throw new Error("Could not save settings. Please try again.");
    return { ok: true };
  });
