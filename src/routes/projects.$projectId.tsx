import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProjectDetail } from "@/components/site/ProjectDetail";
import { projectQuery, siteSettingsQuery } from "@/lib/queries";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/projects/$projectId")({
  loader: async ({ context, params }) => {
    if (!UUID_RE.test(params.projectId)) throw notFound();
    const [project] = await Promise.all([
      context.queryClient.ensureQueryData(projectQuery(params.projectId)),
      context.queryClient.ensureQueryData(siteSettingsQuery()),
    ]);
    if (!project) throw notFound();
    return { title: project.title, description: project.short_description, image: project.image_src };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Project unavailable — EngineeringX" }, { name: "robots", content: "noindex" }] };
    }
    const meta = [
      { title: `${loaderData.title} — EngineeringX` },
      { name: "description", content: loaderData.description },
      { property: "og:title", content: loaderData.title },
      { property: "og:description", content: loaderData.description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (loaderData.image.startsWith("https://")) {
      meta.push({ property: "og:image", content: loaderData.image });
      meta.push({ name: "twitter:image", content: loaderData.image });
    }
    return { meta };
  },
  notFoundComponent: ProjectNotFound,
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const { data: project } = useSuspenseQuery(projectQuery(projectId));
  if (!project) return <ProjectNotFound />;

  return (
    <SiteLayout>
      <div className="container-page py-12 md:py-16">
        <Link
          to="/projects"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All projects
        </Link>
        <ProjectDetail project={project} />
      </div>
    </SiteLayout>
  );
}

function ProjectNotFound() {
  return (
    <SiteLayout>
      <div className="container-page py-24 text-center">
        <p className="eyebrow text-signal">Not found</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">This project isn't available.</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed or the link is incorrect.</p>
        <Link to="/projects" className="mt-6 inline-block text-sm font-medium text-signal hover:underline">
          Browse all projects
        </Link>
      </div>
    </SiteLayout>
  );
}
