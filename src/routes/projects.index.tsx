import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProjectGrid } from "@/components/site/ProjectCard";
import { projectsQuery, siteSettingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — EngineeringX" },
      {
        name: "description",
        content: "Engineering projects built by EngineeringX members across software, robotics, electronics, and design.",
      },
      { property: "og:title", content: "Projects — EngineeringX" },
      { property: "og:description", content: "Real engineering projects built by EngineeringX members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(projectsQuery()),
      context.queryClient.ensureQueryData(siteSettingsQuery()),
    ]);
  },
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery());

  return (
    <SiteLayout>
      <section className="bg-navy text-navy-foreground">
        <div className="container-page py-16 md:py-20">
          <p className="eyebrow text-signal-soft">Projects</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Projects</h1>
          <p className="mt-4 max-w-2xl text-navy-muted">
            Work published by EngineeringX — from software and robotics to electronics and mechanical design.
          </p>
        </div>
      </section>
      <section className="container-page py-16 md:py-20">
        <ProjectGrid projects={projects} />
      </section>
    </SiteLayout>
  );
}
