import { queryOptions } from "@tanstack/react-query";
import { getImpactStats, getProject, getSiteSettings, listProjects } from "./projects.functions";
import { getNewsPost, listNews, listPartners } from "./content.functions";

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

export const impactQuery = () =>
  queryOptions({
    queryKey: ["impact"],
    queryFn: () => getImpactStats(),
  });

export const newsQuery = (limit?: number) =>
  queryOptions({
    queryKey: ["news", { limit: limit ?? null }],
    queryFn: () => listNews({ data: { limit } }),
  });

export const newsPostQuery = (id: string) =>
  queryOptions({
    queryKey: ["news-post", id],
    queryFn: () => getNewsPost({ data: { id } }),
  });

export const partnersQuery = () =>
  queryOptions({
    queryKey: ["partners"],
    queryFn: () => listPartners(),
  });

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
