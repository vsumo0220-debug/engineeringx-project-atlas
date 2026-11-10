import { Link } from "@tanstack/react-router";
import type { Project } from "@/lib/projects.functions";
import { formatDate } from "@/lib/queries";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="group flex flex-col overflow-hidden rounded-md border bg-card transition-colors hover:border-foreground/25"
    >
      <div className="aspect-[16/10] overflow-hidden border-b bg-muted">
        {project.image_src ? (
          <img
            src={project.image_src}
            alt={project.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <time dateTime={project.created_at} className="eyebrow text-muted-foreground">
          {formatDate(project.created_at)}
        </time>
        <h3 className="text-lg font-semibold tracking-tight group-hover:text-signal">{project.title}</h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{project.short_description}</p>
      </div>
    </Link>
  );
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-6 py-16 text-center">
        <p className="font-medium">No projects published yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">Our first projects will appear here soon.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}
