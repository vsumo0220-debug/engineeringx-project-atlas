import { z } from "zod";
import { CONTACT_CATEGORY_VALUES, ENGINEERING_FIELDS, NEWS_CATEGORY_VALUES } from "./site";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const httpsUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

const email = z
  .string()
  .trim()
  .min(1, "Email address is required")
  .max(255, "Email must be under 255 characters")
  .email("Enter a valid email address");

const fullName = z
  .string()
  .trim()
  .min(1, "Full name is required")
  .max(120, "Name must be under 120 characters");

export const contactInquirySchema = z.object({
  full_name: fullName,
  email,
  organization: optionalText(160, "Organization must be under 160 characters"),
  category: z.enum(CONTACT_CATEGORY_VALUES, { errorMap: () => ({ message: "Choose an inquiry category" }) }),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(5000, "Message must be under 5000 characters"),
});
export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;

export const membershipApplicationSchema = z.object({
  full_name: fullName,
  email,
  age_or_year: z
    .string()
    .trim()
    .min(1, "Tell us your age or school year")
    .max(60, "Keep this under 60 characters"),
  interests: z
    .array(z.enum(ENGINEERING_FIELDS))
    .min(1, "Choose at least one engineering interest")
    .max(ENGINEERING_FIELDS.length),
  skills: optionalText(2000, "Keep this under 2000 characters"),
  motivation: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(4000, "Keep this under 4000 characters"),
  previous_projects: optionalText(4000, "Keep this under 4000 characters"),
});
export type MembershipApplicationInput = z.infer<typeof membershipApplicationSchema>;

export const newsInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(140, "Keep the title under 140 characters"),
  summary: z
    .string()
    .trim()
    .min(1, "Short description is required")
    .max(300, "Keep the short description under 300 characters"),
  body: z.string().trim().max(20000, "Text is too long").default(""),
  category: z.enum(NEWS_CATEGORY_VALUES),
  image_path: optionalText(500, "Invalid image"),
});
export type NewsInput = z.infer<typeof newsInputSchema>;

export const partnerInputSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required").max(120, "Keep the name under 120 characters"),
  kind: z.enum(["partner", "sponsor"]),
  description: optionalText(400, "Keep the description under 400 characters"),
  website_url: optionalText(500, "Link is too long").refine(
    (v) => v === null || httpsUrl(v),
    "Enter a full website address (https://…)",
  ),
  logo_path: optionalText(500, "Invalid image"),
});
export type PartnerInput = z.infer<typeof partnerInputSchema>;
