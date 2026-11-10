import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Goals, JoinSection } from "@/components/site/Sections";
import { siteSettingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join Us — EngineeringX" },
      {
        name: "description",
        content:
          "Interested in engineering, robotics, software, or technology? Join the EngineeringX community on Discord.",
      },
      { property: "og:title", content: "Join EngineeringX" },
      {
        property: "og:description",
        content: "Become part of a community that turns ideas into reality.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery()),
  component: JoinPage,
});

function JoinPage() {
  return (
    <SiteLayout>
      <JoinSection />
      <Goals />
    </SiteLayout>
  );
}
