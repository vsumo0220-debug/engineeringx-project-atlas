export const SITE_NAME = "EngineeringX";

export const SITE_DESCRIPTION =
  "EngineeringX is an independent, student-led engineering organization built around innovation, collaboration, and practical engineering.";

export const DEFAULT_DISCORD_URL = "https://discord.gg/";

export const GOALS = [
  {
    title: "Innovation",
    description: "Encourage creative thinking and new engineering ideas.",
  },
  {
    title: "Practical Learning",
    description: "Develop real-world technical skills through projects.",
  },
  {
    title: "Collaboration",
    description: "Bring together students from different engineering disciplines.",
  },
  {
    title: "Development",
    description: "Help members grow their knowledge and experience.",
  },
] as const;

export const PROJECT_STATUSES = [
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
  { value: "planning", label: "Planning" },
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];
export const PROJECT_STATUS_VALUES = PROJECT_STATUSES.map((s) => s.value) as [ProjectStatus, ...ProjectStatus[]];
export function statusLabel(status: string) {
  return PROJECT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** Engineering disciplines used for project categories, join cards and application interests. */
export const ENGINEERING_FIELDS = [
  "Robotics",
  "Software Engineering",
  "Mechatronics",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Electronics",
  "CAD and Product Design",
] as const;

export const CONTACT_CATEGORIES = [
  { value: "general", label: "General inquiry", description: "Questions about EngineeringX and what we do." },
  {
    value: "sponsorship",
    label: "Sponsorship and funding",
    description: "Support our equipment, workspace and projects.",
  },
  {
    value: "partnership",
    label: "Company or organizational partnership",
    description: "Work with us as a company, school or organization.",
  },
  {
    value: "collaboration",
    label: "Project collaboration",
    description: "Build, mentor or test an engineering project together.",
  },
  { value: "membership", label: "Membership", description: "Questions about joining as a student member." },
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]["value"];
export const CONTACT_CATEGORY_VALUES = CONTACT_CATEGORIES.map((c) => c.value) as [
  ContactCategory,
  ...ContactCategory[],
];
export function contactCategoryLabel(value: string) {
  return CONTACT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const NEWS_CATEGORIES = [
  { value: "milestone", label: "Project milestone" },
  { value: "prototype", label: "New prototype" },
  { value: "competition", label: "Competition" },
  { value: "recruitment", label: "Recruitment" },
  { value: "partnership", label: "Partnership" },
  { value: "club", label: "Club update" },
  { value: "event", label: "Event" },
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number]["value"];
export const NEWS_CATEGORY_VALUES = NEWS_CATEGORIES.map((c) => c.value) as [NewsCategory, ...NewsCategory[]];
export function newsCategoryLabel(value: string) {
  return NEWS_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const PARTNER_KINDS = [
  { value: "partner", label: "Partner" },
  { value: "sponsor", label: "Sponsor" },
] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number]["value"];
