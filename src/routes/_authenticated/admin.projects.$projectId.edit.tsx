import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { updateProject } from "@/lib/projects.functions";
import { projectQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/projects/$projectId/edit")({
  component: EditProjectPage,
});

function EditProjectPage() {
  const { projectId } = Route.useParams();
  const { data: project, isLoading, error } = useQuery(projectQuery(projectId));
  const update = useServerFn(updateProject);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to projects
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Edit project</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading project…
        </div>
      ) : error || !project ? (
        <p className="py-16 text-sm text-destructive">This project could not be found.</p>
      ) : (
        <ProjectForm
          key={project.id}
          initial={project}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            await update({ data: { id: project.id, ...values } });
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["projects"] }),
              queryClient.invalidateQueries({ queryKey: ["project", project.id] }),
            ]);
            toast.success("Changes saved");
            navigate({ to: "/admin" });
          }}
        />
      )}
    </div>
  );
}
