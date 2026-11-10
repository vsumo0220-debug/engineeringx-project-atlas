import { queryOptions } from "@tanstack/react-query";
import { getProject, getSiteSettings, listProjects } from "./projects.functions";

export const projectsQuery = (limit?: number) =>
  queryOptions({
    queryKey: ["projects", { limit: limit ?? null }],
    queryFn: () => listProjects({ data: { limit } }),
  });

export const projectQuery = (id: string) =>
  queryOptions({
    queryKey: ["project", id],
    queryFn: () => getProject({ data: { id } }),
  });

export const siteSettingsQuery = () =>
  queryOptions({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
    staleTime: 60_000,
  });

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
