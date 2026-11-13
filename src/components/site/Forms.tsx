import { useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { contactInquirySchema, membershipApplicationSchema } from "@/lib/content-schema";
import { submitContactInquiry, submitMembershipApplication } from "@/lib/content.functions";
import { CONTACT_CATEGORIES, ENGINEERING_FIELDS, type ContactCategory } from "@/lib/site";
import { cn } from "@/lib/utils";

type Errs = Record<string, string | undefined>;

function collect(issues: { path: (string | number)[]; message: string }[]): Errs {
  const out: Errs = {};
  for (const i of issues) {
    const k = String(i.path[0]);
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Success({ title, text, onReset }: { title: string; text: string; onReset: () => void }) {
  return (
    <div role="status" className="rounded-md border bg-card p-8 text-center">
      <CheckCircle2 className="mx-auto size-8 text-signal" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <Button variant="outline" className="mt-6" onClick={onReset}>
        Send another
      </Button>
    </div>
  );
}

/** Hidden field bots tend to fill; the server rejects any value. */
function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="hidden" aria-hidden="true">
      <label>
        Website <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export function ContactForm({ defaultCategory = "general" }: { defaultCategory?: ContactCategory }) {
  const send = useServerFn(submitContactInquiry);
  const [v, setV] = useState({ full_name: "", email: "", organization: "", category: defaultCategory as string, message: "" });
  const [bot, setBot] = useState("");
  const [errors, setErrors] = useState<Errs>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof v) => (val: string) => setV((p) => ({ ...p, [k]: val }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = contactInquirySchema.safeParse(v);
    if (!parsed.success) return setErrors(collect(parsed.error.issues));
    setErrors({});
    setBusy(true);
    try {
      await send({ data: { ...parsed.data, website: bot } });
      setDone(true);
      setV({ full_name: "", email: "", organization: "", category: defaultCategory, message: "" });
    } catch {
      setFormError("Your message could not be sent. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <Success title="Message sent" text="Thank you for reaching out. A member of the EngineeringX team will reply by email." onReset={() => setDone(false)} />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 rounded-md border bg-card p-6 md:p-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          What is this about? <span className="text-destructive">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONTACT_CATEGORIES.map((c) => (
            <label
              key={c.value}
              className={cn(
                "cursor-pointer rounded-sm border p-3 text-sm transition-colors hover:border-foreground/30",
                v.category === c.value && "border-signal bg-signal/5",
              )}
            >
              <input type="radio" name="category" value={c.value} checked={v.category === c.value} onChange={() => set("category")(c.value)} className="sr-only" />
              <span className="block font-medium">{c.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{c.description}</span>
            </label>
          ))}
        </div>
        {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
      </fieldset>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="c-name" label="Full name" required error={errors.full_name}>
          <Input id="c-name" autoComplete="name" maxLength={120} value={v.full_name} onChange={(e) => set("full_name")(e.target.value)} />
        </Field>
        <Field id="c-email" label="Email" required error={errors.email}>
          <Input id="c-email" type="email" autoComplete="email" maxLength={255} value={v.email} onChange={(e) => set("email")(e.target.value)} />
        </Field>
      </div>
      <Field id="c-org" label="Organization (optional)" error={errors.organization}>
        <Input id="c-org" autoComplete="organization" maxLength={160} value={v.organization} onChange={(e) => set("organization")(e.target.value)} />
      </Field>
      <Field id="c-msg" label="Message" required error={errors.message}>
        <Textarea id="c-msg" rows={6} maxLength={5000} value={v.message} onChange={(e) => set("message")(e.target.value)} />
      </Field>
      <Honeypot value={bot} onChange={setBot} />
      {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" variant="signal" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        Send message
      </Button>
    </form>
  );
}

export function ApplicationForm() {
  const send = useServerFn(submitMembershipApplication);
  const empty = { full_name: "", email: "", age_or_year: "", skills: "", motivation: "", previous_projects: "" };
  const [v, setV] = useState(empty);
  const [interests, setInterests] = useState<string[]>([]);
  const [bot, setBot] = useState("");
  const [errors, setErrors] = useState<Errs>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof v) => (val: string) => setV((p) => ({ ...p, [k]: val }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = membershipApplicationSchema.safeParse({ ...v, interests });
    if (!parsed.success) return setErrors(collect(parsed.error.issues));
    setErrors({});
    setBusy(true);
    try {
      await send({ data: { ...parsed.data, website: bot } });
      setDone(true);
      setV(empty);
      setInterests([]);
    } catch {
      setFormError("Your application could not be sent. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <Success title="Application received" text="Thanks for applying to EngineeringX. We'll review it and contact you by email." onReset={() => setDone(false)} />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 rounded-md border bg-card p-6 md:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="a-name" label="Full name" required error={errors.full_name}>
          <Input id="a-name" autoComplete="name" maxLength={120} value={v.full_name} onChange={(e) => set("full_name")(e.target.value)} />
        </Field>
        <Field id="a-email" label="Email" required error={errors.email}>
          <Input id="a-email" type="email" autoComplete="email" maxLength={255} value={v.email} onChange={(e) => set("email")(e.target.value)} />
        </Field>
      </div>
      <Field id="a-age" label="Age or school year" required error={errors.age_or_year}>
        <Input id="a-age" maxLength={60} placeholder="e.g. 16 or Grade 11" value={v.age_or_year} onChange={(e) => set("age_or_year")(e.target.value)} />
      </Field>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          Engineering interests <span className="text-destructive">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ENGINEERING_FIELDS.map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={interests.includes(f)}
                onCheckedChange={(c) => setInterests((p) => (c ? [...p, f] : p.filter((x) => x !== f)))}
              />
              {f}
            </label>
          ))}
        </div>
        {errors.interests && <p className="text-xs text-destructive">{errors.interests}</p>}
      </fieldset>
      <Field id="a-skills" label="Skills and experience (optional)" error={errors.skills}>
        <Textarea id="a-skills" rows={3} maxLength={2000} value={v.skills} onChange={(e) => set("skills")(e.target.value)} />
      </Field>
      <Field id="a-why" label="Why do you want to join?" required error={errors.motivation}>
        <Textarea id="a-why" rows={4} maxLength={4000} value={v.motivation} onChange={(e) => set("motivation")(e.target.value)} />
      </Field>
      <Field id="a-prev" label="Previous projects (optional)" error={errors.previous_projects}>
        <Textarea id="a-prev" rows={3} maxLength={4000} value={v.previous_projects} onChange={(e) => set("previous_projects")(e.target.value)} />
      </Field>
      <Honeypot value={bot} onChange={setBot} />
      {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" variant="signal" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        Submit application
      </Button>
    </form>
  );
}
