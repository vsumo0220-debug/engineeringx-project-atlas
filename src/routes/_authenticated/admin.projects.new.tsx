import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { createProject } from "@/lib/projects.functions";

export const Route = createFileRoute("/_authenticated/admin/projects/new")({
  component: NewProjectPage,
});

function NewProjectPage() {
  const create = useServerFn(createProject);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to projects
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">New project</h1>
      </div>
      <ProjectForm
        submitLabel="Publish project"
        onSubmit={async (values) => {
          await create({ data: values });
          await queryClient.invalidateQueries({ queryKey: ["projects"] });
          toast.success("Project published");
          navigate({ to: "/admin" });
        }}
      />
    </div>
  );
}
