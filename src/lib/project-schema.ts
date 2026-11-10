import { z } from "zod";
import { isDiscordInviteUrl, isGitHubUrl, parseYouTubeId } from "./links";

const optionalUrl = (check: (v: string) => boolean, message: string) =>
  z
    .string()
    .trim()
    .max(500, "Link is too long")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || check(v), message);

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
  image_path: z.string().trim().min(1, "Project cover image is required").max(500),
  youtube_url: optionalUrl((v) => parseYouTubeId(v) !== null, "Enter a valid YouTube video link"),
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
});
