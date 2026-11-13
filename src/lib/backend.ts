import { createServerOnlyFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** One private bucket holds project, news and partner images (paths prefixed news/ and partners/). */
export const MEDIA_BUCKET = "project-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365;

export type Db = SupabaseClient<Database>;

export const getPublicClient = createServerOnlyFn((): Db => {
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
  const base = (import.meta.env["VITE_SUPABASE_URL"] ?? "").replace(/\/+$/, "");
  return idx >= 0 && base ? base + signedUrl.slice(idx) : signedUrl;
}

/**
 * Returns a path -> signed URL map for every non-empty path.
 * The bucket has no visitor read rule, so links are signed server-side with the privileged client;
 * callers only pass paths already read from published rows.
 */
export async function signPaths(paths: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from(MEDIA_BUCKET).createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, toBrowserUrl(item.signedUrl));
  }
  return map;
}

export async function assertAdmin(supabase: Db, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || data !== true) {
    throw new Error("Forbidden: administrator access is required.");
  }
}

export async function removeMedia(supabase: Db, paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length > 0) await supabase.storage.from(MEDIA_BUCKET).remove(list);
}
