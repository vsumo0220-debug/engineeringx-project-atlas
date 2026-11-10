import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { SiteLayout, SectionHeading } from "@/components/site/SiteLayout";
import { Goals, Hero, Introduction, JoinSection } from "@/components/site/Sections";
import { ProjectGrid } from "@/components/site/ProjectCard";
import { Button } from "@/components/ui/button";
import { projectsQuery, siteSettingsQuery } from "@/lib/queries";

const HOME_LIMIT = 6;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EngineeringX — Engineering Beyond Boundaries" },
      {
        name: "description",
        content:
          "An independent, student-led engineering organization for software, robotics, electronics, mechanical engineering, and design.",
      },
      { property: "og:title", content: "EngineeringX — Engineering Beyond Boundaries" },
      {
        property: "og:description",
        content:
          "An independent, student-led engineering organization turning ideas into real projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(projectsQuery(HOME_LIMIT)),
      context.queryClient.ensureQueryData(siteSettingsQuery()),
    ]);
  },
  component: HomePage,
});

function HomePage() {
  const { data: projects } = useSuspenseQuery(projectsQuery(HOME_LIMIT));

  return (
    <SiteLayout>
      <Hero />
      <Introduction />
      <Goals />
      <section className="border-b">
        <div className="container-page py-20 md:py-28">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading label="Projects" title="What our members are building." />
            {projects.length > 0 && (
              <Button asChild variant="outline">
                <Link to="/projects">
                  All projects
                  <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
          <div className="mt-12">
            <ProjectGrid projects={projects} />
          </div>
        </div>
      </section>
      <JoinSection />
    </SiteLayout>
  );
}
