import { Github, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseYouTubeId } from "@/lib/links";
import { formatDate } from "@/lib/queries";

export type ProjectView = {
  title: string;
  short_description: string;
  full_description: string;
  image_src: string;
  youtube_url: string | null;
  github_url: string | null;
  created_at: string;
};

export function ProjectDetail({ project }: { project: ProjectView }) {
  const videoId = project.youtube_url ? parseYouTubeId(project.youtube_url) : null;
  const paragraphs = project.full_description.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <article>
      <header className="space-y-5">
        <time dateTime={project.created_at} className="eyebrow block text-muted-foreground">
          Published {formatDate(project.created_at)}
        </time>
        <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">{project.title}</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">{project.short_description}</p>
        {(project.github_url || project.youtube_url) && (
          <div className="flex flex-wrap gap-3 pt-1">
            {project.github_url && (
              <Button asChild variant="default">
                <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                  <Github />
                  View on GitHub
                </a>
              </Button>
            )}
            {project.youtube_url && (
              <Button asChild variant="outline">
                <a href={project.youtube_url} target="_blank" rel="noopener noreferrer">
                  <Youtube />
                  Watch on YouTube
                </a>
              </Button>
            )}
          </div>
        )}
      </header>

      {project.image_src && (
        <div className="mt-10 overflow-hidden rounded-md border bg-muted">
          <img src={project.image_src} alt={project.title} className="max-h-[560px] w-full object-cover" />
        </div>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_16rem]">
        <div className="max-w-3xl space-y-5 text-base leading-relaxed">
          <h2 className="eyebrow text-signal">Project details</h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}

          {videoId && (
            <div className="pt-6">
              <div className="aspect-video overflow-hidden rounded-md border bg-muted">
                <iframe
                  className="size-full"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title={`${project.title} video`}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit space-y-4 border-t pt-6 text-sm lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <dl className="space-y-4">
            <div>
              <dt className="eyebrow text-muted-foreground">Published</dt>
              <dd className="mt-1">{formatDate(project.created_at)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-muted-foreground">Source code</dt>
              <dd className="mt-1 break-all">
                {project.github_url ? (
                  <a className="text-signal hover:underline" href={project.github_url} target="_blank" rel="noopener noreferrer">
                    {project.github_url.replace(/^https:\/\/(www\.)?/, "")}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not available</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-muted-foreground">Video</dt>
              <dd className="mt-1">
                {project.youtube_url ? (
                  <a className="text-signal hover:underline" href={project.youtube_url} target="_blank" rel="noopener noreferrer">
                    YouTube
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not available</span>
                )}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </article>
  );
}
