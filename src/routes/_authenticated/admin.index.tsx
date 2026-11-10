import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteProject, type Project } from "@/lib/projects.functions";
import { formatDate, projectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: projects, isLoading, error, refetch } = useQuery(projectsQuery());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-signal">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Published projects</h1>
        </div>
        <Button asChild variant="signal">
          <Link to="/admin/projects/new">
            <Plus />
            New project
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading projects…
          </div>
        ) : error ? (
          <div className="space-y-3 py-16 text-center text-sm">
            <p className="text-destructive">Could not load projects.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-medium">No projects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Publish your first project to show it on the website.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {projects.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const remove = useServerFn(deleteProject);
  const mutation = useMutation({
    mutationFn: () => remove({ data: { id: project.id } }),
    onSuccess: async () => {
      toast.success("Project deleted");
      queryClient.removeQueries({ queryKey: ["project", project.id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete the project"),
  });

  return (
    <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-sm border bg-muted">
        {project.image_src && <img src={project.image_src} alt="" className="size-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{project.title}</p>
        <p className="truncate text-sm text-muted-foreground">{project.short_description}</p>
        <p className="eyebrow mt-1 text-muted-foreground">{formatDate(project.created_at)}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/projects/$projectId" params={{ projectId: project.id }} target="_blank">
            <ExternalLink />
            View
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/projects/$projectId/edit" params={{ projectId: project.id }}>
            <Pencil />
            Edit
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={mutation.isPending} aria-label={`Delete ${project.title}`}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this project?</AlertDialogTitle>
              <AlertDialogDescription>
                “{project.title}” and its cover image will be permanently removed from the website.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => mutation.mutate()}
              >
                Delete project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
