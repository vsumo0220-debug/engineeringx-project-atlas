import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  contactInquirySchema,
  membershipApplicationSchema,
  newsInputSchema,
  partnerInputSchema,
} from "./content-schema";
import { assertAdmin, getPublicClient, removeMedia, signPaths } from "./backend";

const idSchema = z.object({ id: z.string().uuid() });

/* ---------- News ---------- */

export type NewsPost = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  image_path: string | null;
  image_src: string;
  published_at: string;
};

export const listNews = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number | undefined } | undefined) =>
    z.object({ limit: z.number().int().min(1).max(100).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<NewsPost[]> => {
    const client = getPublicClient();
    let query = client
      .from("news_posts")
      .select("id, title, summary, body, category, image_path, published_at")
      .order("published_at", { ascending: false });
    if (data.limit) query = query.limit(data.limit);
    const { data: rows, error } = await query;
    if (error) throw new Error("Could not load news.");
    const urls = await signPaths((rows ?? []).map((r) => r.image_path));
    return (rows ?? []).map((r) => ({ ...r, image_src: r.image_path ? (urls.get(r.image_path) ?? "") : "" }));
  });

export const getNewsPost = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => idSchema.parse(input))
  .handler(async ({ data }): Promise<NewsPost | null> => {
    const client = getPublicClient();
    const { data: row, error } = await client
      .from("news_posts")
      .select("id, title, summary, body, category, image_path, published_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error("Could not load this update.");
    if (!row) return null;
    const urls = await signPaths([row.image_path]);
    return { ...row, image_src: row.image_path ? (urls.get(row.image_path) ?? "") : "" };
  });

export const createNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => newsInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase.from("news_posts").insert(data).select("id").single();
    if (error) throw new Error("Could not publish the update. Please try again.");
    return { id: row.id };
  });

export const updateNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => newsInputSchema.extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    const { data: existing } = await context.supabase.from("news_posts").select("image_path").eq("id", id).maybeSingle();
    if (!existing) throw new Error("This update no longer exists.");
    const { error } = await context.supabase.from("news_posts").update(rest).eq("id", id);
    if (error) throw new Error("Could not save changes. Please try again.");
    if (existing.image_path && existing.image_path !== rest.image_path) {
      await removeMedia(context.supabase, [existing.image_path]);
    }
    return { id };
  });

export const deleteNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: existing } = await context.supabase
      .from("news_posts")
      .select("image_path")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("news_posts").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete the update. Please try again.");
    await removeMedia(context.supabase, [existing?.image_path]);
    return { ok: true };
  });

/* ---------- Partners & sponsors ---------- */

export type Partner = {
  id: string;
  name: string;
  kind: string;
  description: string | null;
  website_url: string | null;
  logo_path: string | null;
  logo_src: string;
  sort_order: number;
};

export const listPartners = createServerFn({ method: "GET" }).handler(async (): Promise<Partner[]> => {
  const client = getPublicClient();
  const { data: rows, error } = await client
    .from("partners")
    .select("id, name, kind, description, website_url, logo_path, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error("Could not load partners.");
  const urls = await signPaths((rows ?? []).map((r) => r.logo_path));
  return (rows ?? []).map((r) => ({ ...r, logo_src: r.logo_path ? (urls.get(r.logo_path) ?? "") : "" }));
});

export const createPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => partnerInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: last } = await context.supabase
      .from("partners")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: row, error } = await context.supabase
      .from("partners")
      .insert({ ...data, sort_order: (last?.sort_order ?? -1) + 1 })
      .select("id")
      .single();
    if (error) throw new Error("Could not add this organization. Please try again.");
    return { id: row.id };
  });

export const updatePartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => partnerInputSchema.extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    const { data: existing } = await context.supabase.from("partners").select("logo_path").eq("id", id).maybeSingle();
    if (!existing) throw new Error("This organization no longer exists.");
    const { error } = await context.supabase.from("partners").update(rest).eq("id", id);
    if (error) throw new Error("Could not save changes. Please try again.");
    if (existing.logo_path && existing.logo_path !== rest.logo_path) {
      await removeMedia(context.supabase, [existing.logo_path]);
    }
    return { id };
  });

export const deletePartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: existing } = await context.supabase
      .from("partners")
      .select("logo_path")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("partners").delete().eq("id", data.id);
    if (error) throw new Error("Could not remove this organization. Please try again.");
    await removeMedia(context.supabase, [existing?.logo_path]);
    return { ok: true };
  });

export const reorderPartners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) => z.object({ ids: z.array(z.string().uuid()).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    for (const [index, id] of data.ids.entries()) {
      const { error } = await context.supabase.from("partners").update({ sort_order: index }).eq("id", id);
      if (error) throw new Error("Could not save the new order.");
    }
    return { ok: true };
  });

/* ---------- Visitor submissions (insert-only for visitors) ---------- */

const honeypot = z.object({ website: z.string().max(0).optional() });

export const submitContactInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactInquirySchema.merge(honeypot).parse(input))
  .handler(async ({ data }) => {
    const { website: _bot, ...row } = data;
    const client = getPublicClient();
    const { error } = await client.from("contact_inquiries").insert(row);
    if (error) throw new Error("Your message could not be sent. Please try again.");
    return { ok: true };
  });

export const submitMembershipApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => membershipApplicationSchema.merge(honeypot).parse(input))
  .handler(async ({ data }) => {
    const { website: _bot, ...row } = data;
    const client = getPublicClient();
    const { error } = await client.from("membership_applications").insert(row);
    if (error) throw new Error("Your application could not be sent. Please try again.");
    return { ok: true };
  });

/* ---------- Admin review of submissions ---------- */

export const listInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [contacts, applications] = await Promise.all([
      context.supabase.from("contact_inquiries").select("*").order("created_at", { ascending: false }),
      context.supabase.from("membership_applications").select("*").order("created_at", { ascending: false }),
    ]);
    if (contacts.error || applications.error) throw new Error("Could not load inquiries.");
    return { contacts: contacts.data ?? [], applications: applications.data ?? [] };
  });

const submissionRef = z.object({
  table: z.enum(["contact_inquiries", "membership_applications"]),
  id: z.string().uuid(),
});

export const setSubmissionHandled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submissionRef.extend({ handled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from(data.table).update({ handled: data.handled }).eq("id", data.id);
    if (error) throw new Error("Could not update this entry.");
    return { ok: true };
  });

export const deleteSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submissionRef.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error("Could not delete this entry.");
    return { ok: true };
  });
