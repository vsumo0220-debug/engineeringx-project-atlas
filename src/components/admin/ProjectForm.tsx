import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectDetail } from "@/components/site/ProjectDetail";
import { projectInputSchema, type ProjectInput } from "@/lib/project-schema";
import { cn } from "@/lib/utils";

const BUCKET = "project-images";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export type ProjectFormInitial = {
  title: string;
  short_description: string;
  full_description: string;
  image_path: string;
  image_src: string;
  youtube_url: string | null;
  github_url: string | null;
  created_at?: string;
};

type Errors = Partial<Record<keyof ProjectInput, string>>;

export function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: ProjectFormInitial;
  submitLabel: string;
  onSubmit: (values: ProjectInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [shortDescription, setShortDescription] = useState(initial?.short_description ?? "");
  const [fullDescription, setFullDescription] = useState(initial?.full_description ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtube_url ?? "");
  const [githubUrl, setGithubUrl] = useState(initial?.github_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("edit");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const imageSrc = filePreview ?? initial?.image_src ?? "";
  const previewDate = useMemo(() => initial?.created_at ?? new Date().toISOString(), [initial?.created_at]);

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setErrors((e) => ({ ...e, image_path: "Use a JPG, PNG, WebP, GIF or AVIF image" }));
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setErrors((e) => ({ ...e, image_path: "Image must be 10 MB or smaller" }));
      return;
    }
    setErrors((e) => ({ ...e, image_path: undefined }));
    setFile(f);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const draft = {
      title,
      short_description: shortDescription,
      full_description: fullDescription,
      image_path: file ? "pending-upload" : (initial?.image_path ?? ""),
      youtube_url: youtubeUrl,
      github_url: githubUrl,
    };
    const parsed = projectInputSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProjectInput;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setTab("edit");
      return;
    }
    setErrors({});
    setSubmitting(true);

    let uploadedPath: string | null = null;
    try {
      let imagePath = initial?.image_path ?? "";
      if (file) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${crypto.randomUUID()}.${ext || "jpg"}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error("Image upload failed. Please try another image.");
        uploadedPath = path;
        imagePath = path;
      }
      await onSubmit({ ...parsed.data, image_path: imagePath });
    } catch (err) {
      if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath]);
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <Button type="submit" variant="signal" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>

        {formError && (
          <p role="alert" className="mt-4 rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {formError}
          </p>
        )}

        <TabsContent value="edit" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-6 rounded-md border bg-card p-6">
              <Field label="Project title" htmlFor="title" required error={errors.title}>
                <Input id="title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field
                label="Short description"
                htmlFor="short"
                required
                error={errors.short_description}
                hint={`${shortDescription.length}/240 · shown on project cards`}
              >
                <Textarea
                  id="short"
                  rows={2}
                  maxLength={240}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                />
              </Field>
              <Field
                label="Full project description"
                htmlFor="full"
                required
                error={errors.full_description}
                hint="Separate paragraphs with a blank line."
              >
                <Textarea
                  id="full"
                  rows={12}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                />
              </Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="YouTube URL" htmlFor="youtube" error={errors.youtube_url} hint="Optional">
                  <Input
                    id="youtube"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                </Field>
                <Field label="GitHub repository URL" htmlFor="github" error={errors.github_url} hint="Optional">
                  <Input
                    id="github"
                    type="url"
                    placeholder="https://github.com/…"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div className="h-fit space-y-3 rounded-md border bg-card p-6">
              <Label>
                Cover image <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pickFile(e.dataTransfer.files[0]);
                }}
                className={cn(
                  "flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-sm border border-dashed bg-muted text-sm text-muted-foreground transition-colors hover:border-foreground/30",
                  errors.image_path && "border-destructive",
                )}
              >
                {imageSrc ? (
                  <img src={imageSrc} alt="Cover preview" className="size-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-2">
                    <ImagePlus className="size-6" />
                    Click or drop an image
                  </span>
                )}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="sr-only"
                aria-label="Upload cover image"
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {imageSrc && (
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInput.current?.click()}>
                  Replace image
                </Button>
              )}
              {errors.image_path ? (
                <p className="text-xs text-destructive">{errors.image_path}</p>
              ) : (
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF or AVIF · up to 10 MB</p>
              )}
              <p className="eyebrow pt-2 text-muted-foreground">Publication date is set automatically.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <div className="rounded-md border bg-background p-6 md:p-10">
            <ProjectDetail
              project={{
                title: title || "Untitled project",
                short_description: shortDescription || "Short description",
                full_description: fullDescription || "Full project description",
                image_src: imageSrc,
                youtube_url: youtubeUrl.trim() || null,
                github_url: githubUrl.trim() || null,
                created_at: previewDate,
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
