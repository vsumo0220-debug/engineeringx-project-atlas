import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectDetail } from "@/components/site/ProjectDetail";
import { MAX_PROJECT_IMAGES, projectInputSchema, type ProjectInput } from "@/lib/project-schema";
import { cn } from "@/lib/utils";

const BUCKET = "project-images";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export type ProjectFormInitial = {
  title: string;
  short_description: string;
  full_description: string;
  images: { path: string; src: string }[];
  image_src: string;
  youtube_url: string | null;
  github_url: string | null;
  category?: string | null;
  status?: string;
  team?: string | null;
  technologies?: string[];
  demo_url?: string | null;
  created_at?: string;
};

type GalleryItem = { key: string; path?: string; file?: File; src: string };

type Errors = Partial<Record<keyof ProjectInput | "image_path", string | undefined>>;

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
  const [items, setItems] = useState<GalleryItem[]>(() =>
    (initial?.images ?? []).map((i) => ({ key: i.path, path: i.path, src: i.src })),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("edit");
  const fileInput = useRef<HTMLInputElement>(null);

  // Revoke local preview URLs when the form unmounts.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach((i) => i.file && URL.revokeObjectURL(i.src)), []);

  const imageSrc = items[0]?.src ?? "";
  const previewDate = useMemo(() => initial?.created_at ?? new Date().toISOString(), [initial?.created_at]);

  function addFiles(list: FileList | null | undefined) {
    if (!list) return;
    const added: GalleryItem[] = [];
    let problem: string | undefined;
    for (const f of Array.from(list)) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        problem = "Use JPG, PNG, WebP, GIF or AVIF images";
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        problem = "Each image must be 10 MB or smaller";
        continue;
      }
      added.push({ key: crypto.randomUUID(), file: f, src: URL.createObjectURL(f) });
    }
    setItems((prev) => {
      const room = MAX_PROJECT_IMAGES - prev.length;
      if (added.length > room) problem = `Up to ${MAX_PROJECT_IMAGES} images per project`;
      added.slice(Math.max(room, 0)).forEach((i) => URL.revokeObjectURL(i.src));
      return [...prev, ...added.slice(0, Math.max(room, 0))];
    });
    setErrors((e) => ({ ...e, image_path: problem }));
  }

  function move(index: number, delta: number) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function makeCover(index: number) {
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      return item ? [item, ...next] : prev;
    });
  }

  function remove(index: number) {
    setItems((prev) => {
      const item = prev[index];
      if (item?.file) URL.revokeObjectURL(item.src);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const draft = {
      title,
      short_description: shortDescription,
      full_description: fullDescription,
      category: initial?.category ?? null,
      status: (initial?.status ?? "completed") as ProjectInput["status"],
      team: initial?.team ?? null,
      technologies: initial?.technologies ?? [],
      images: items.map((i) => i.path ?? "pending-upload"),
      youtube_url: youtubeUrl,
      demo_url: initial?.demo_url ?? null,
      github_url: githubUrl,
    };
    const parsed = projectInputSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const raw = issue.path[0] as keyof ProjectInput;
        const key = raw === "images" ? "image_path" : raw;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setTab("edit");
      return;
    }
    setErrors({});
    setSubmitting(true);

    const uploaded: string[] = [];
    try {
      const paths: string[] = [];
      for (const item of items) {
        if (item.path) {
          paths.push(item.path);
          continue;
        }
        const file = item.file!;
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${crypto.randomUUID()}.${ext || "jpg"}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error("Image upload failed. Please try another image.");
        uploaded.push(path);
        paths.push(path);
      }
      await onSubmit({ ...parsed.data, images: paths });
    } catch (err) {
      if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
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
                Project images <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">The first image is the cover. Use the arrows to reorder.</p>
              {items.length > 0 && (
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={item.key} className="flex items-center gap-2 rounded-sm border p-1.5">
                      <img src={item.src} alt={`Image ${i + 1}`} className="h-12 w-16 shrink-0 rounded-sm object-cover" />
                      <div className="min-w-0 flex-1 text-xs">
                        {i === 0 ? (
                          <span className="font-medium text-signal">Cover</span>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => makeCover(i)}
                          >
                            <Star className="size-3" /> Set as cover
                          </button>
                        )}
                      </div>
                      <div className="flex shrink-0">
                        <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                          <ArrowDown className="size-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive" aria-label="Delete image" onClick={() => remove(i)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed bg-muted py-6 text-sm text-muted-foreground transition-colors hover:border-foreground/30",
                  errors.image_path && "border-destructive",
                )}
              >
                <ImagePlus className="size-6" />
                {items.length ? "Add more images" : "Click or drop images"}
              </button>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                className="sr-only"
                aria-label="Upload project images"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {errors.image_path ? (
                <p className="text-xs text-destructive">{errors.image_path}</p>
              ) : (
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF or AVIF · up to 10 MB each</p>
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
                images: items.map((i) => ({ src: i.src })),
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
  error?: string | undefined;
  hint?: string | undefined;
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
