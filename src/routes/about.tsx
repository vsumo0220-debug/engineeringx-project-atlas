import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Goals, Introduction, JoinSection } from "@/components/site/Sections";
import { siteSettingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — EngineeringX" },
      {
        name: "description",
        content:
          "What EngineeringX is and the goals behind it: innovation, practical learning, collaboration, and development.",
      },
      { property: "og:title", content: "About EngineeringX" },
      {
        property: "og:description",
        content: "A community where curious minds explore engineering and build meaningful projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery()),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="bg-navy text-navy-foreground">
        <div className="container-page py-16 md:py-20">
          <p className="eyebrow text-signal-soft">About</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            An independent, student-led engineering organization.
          </h1>
        </div>
      </section>
      <Introduction />
      <Goals />
      <JoinSection />
    </SiteLayout>
  );
}
