import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Lock } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/site/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Administrator sign in — EngineeringX" },
      { name: "description", content: "Sign in to the EngineeringX administrator dashboard." },
      { property: "og:title", content: "Administrator sign in — EngineeringX" },
      { property: "og:description", content: "Restricted area for EngineeringX administrators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(1, "Enter your password").max(200),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes("invalid")
          ? "Incorrect email or password."
          : signInError.message,
      );
      return;
    }
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy text-navy-foreground">
      <div className="blueprint-grid pointer-events-none fixed inset-0 opacity-40" aria-hidden="true" />
      <div className="relative flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
            <LogoMark />
            <span className="font-semibold tracking-tight">EngineeringX</span>
          </Link>
          <div className="rounded-md border bg-card p-7 text-card-foreground">
            <div className="mb-6 space-y-1.5">
              <p className="eyebrow flex items-center gap-1.5 text-signal">
                <Lock className="size-3" /> Restricted
              </p>
              <h1 className="text-xl font-semibold tracking-tight">Administrator sign in</h1>
              <p className="text-sm text-muted-foreground">Only approved administrator accounts can sign in.</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
            </form>
          </div>
          <p className="mt-6 text-center text-xs text-navy-muted">
            <Link to="/" className="hover:text-navy-foreground">
              ← Back to website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
