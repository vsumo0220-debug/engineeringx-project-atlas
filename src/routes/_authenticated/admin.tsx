import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, LogOut, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/site/Logo";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — EngineeringX" },
      { name: "description", content: "Manage EngineeringX projects and settings." },
      { property: "og:title", content: "Admin dashboard — EngineeringX" },
      { property: "og:description", content: "Restricted administrator area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    return { isAdmin: data === true };
  },
  component: AdminLayout,
});

function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function AdminLayout() {
  const { isAdmin, user } = Route.useRouteContext();
  const signOut = useSignOut();

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <ShieldAlert className="mx-auto size-8 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.email} is signed in but does not have administrator access.
          </p>
          <Button className="mt-6" variant="outline" onClick={signOut}>
            <LogOut />
            Log out
          </Button>
        </div>
      </div>
    );
  }

  const navClass =
    "rounded-sm px-3 py-1.5 text-sm text-navy-muted hover:text-navy-foreground data-[status=active]:bg-navy-hover data-[status=active]:text-navy-foreground";

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-navy-border bg-navy text-navy-foreground">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="flex items-center gap-2">
              <LogoMark className="size-7" />
              <span className="text-sm font-semibold">Admin</span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Admin">
              <Link to="/admin" activeOptions={{ exact: true }} className={navClass}>
                Projects
              </Link>
              <Link to="/admin/settings" className={navClass}>
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="navy-ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/">
                View site
                <ExternalLink />
              </Link>
            </Button>
            <Button variant="navy-ghost" size="sm" onClick={signOut}>
              <LogOut />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="container-page py-10">
        <Outlet />
      </main>
    </div>
  );
}
