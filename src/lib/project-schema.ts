import { z } from "zod";
import { isDiscordInviteUrl, isGitHubUrl, parseYouTubeId } from "./links";
import { PROJECT_STATUS_VALUES } from "./site";

export const MAX_PROJECT_IMAGES = 40;

const optionalUrl = (check: (v: string) => boolean, message: string) =>
  z
    .string()
    .trim()
    .max(500, "Link is too long")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || check(v), message);

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

function isWebUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** "Arduino, ESP32,  servo " -> ["Arduino", "ESP32", "servo"], de-duplicated. */
export function parseTechnologies(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(/[,\n]/)) {
    const t = raw.trim();
    if (t && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase());
      out.push(t);
    }
  }
  return out;
}

export const projectInputSchema = z.object({
  title: z.string().trim().min(1, "Project title is required").max(120, "Keep the title under 120 characters"),
  short_description: z
    .string()
    .trim()
    .min(1, "Short description is required")
    .max(240, "Keep the short description under 240 characters"),
  full_description: z
    .string()
    .trim()
    .min(1, "Full project description is required")
    .max(20000, "Description is too long"),
  category: optionalText(60, "Keep the category under 60 characters"),
  status: z.enum(PROJECT_STATUS_VALUES, { errorMap: () => ({ message: "Choose a project status" }) }),
  team: optionalText(500, "Keep the team list under 500 characters"),
  technologies: z
    .array(z.string().trim().min(1).max(60, "Each technology must be under 60 characters"))
    .max(30, "List up to 30 technologies")
    .default([]),
  /** Ordered storage paths; the first one is the main image. */
  images: z
    .array(z.string().trim().min(1).max(500))
    .min(1, "Add at least one project image")
    .max(MAX_PROJECT_IMAGES, `Up to ${MAX_PROJECT_IMAGES} images per project`),
  youtube_url: optionalUrl((v) => parseYouTubeId(v) !== null, "Enter a valid YouTube video link"),
  demo_url: optionalUrl(isWebUrl, "Enter a full website address (https://…)"),
  github_url: optionalUrl(isGitHubUrl, "Enter a valid GitHub link (https://github.com/...)"),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

export const projectUpdateSchema = projectInputSchema.extend({
  id: z.string().uuid(),
});

export const siteSettingsSchema = z.object({
  discord_url: z
    .string()
    .trim()
    .min(1, "Discord invite link is required")
    .max(300)
    .refine(isDiscordInviteUrl, "Enter a Discord invite link (https://discord.gg/...)"),
  active_members: z
    .number({ invalid_type_error: "Enter a whole number" })
    .int("Enter a whole number")
    .min(0, "Cannot be negative")
    .max(100000)
    .nullable()
    .default(null),
  contact_email: z
    .string()
    .trim()
    .max(255)
    .email("Enter a valid email address")
    .nullable()
    .or(z.literal("").transform(() => null))
    .default(null),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
