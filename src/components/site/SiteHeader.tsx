import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { DiscordButton } from "./DiscordButton";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/join", label: "Join Us" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-border bg-navy text-navy-foreground">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-sm px-3 py-2 text-sm text-navy-muted transition-colors hover:text-navy-foreground data-[status=active]:text-navy-foreground"
            >
              {item.label}
            </Link>
          ))}
          <DiscordButton size="sm" className="ml-3" label="Discord" />
        </nav>

        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-sm text-navy-foreground hover:bg-navy-hover md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-navy-border md:hidden" aria-label="Mobile">
          <div className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm text-navy-muted data-[status=active]:text-navy-foreground"
              >
                {item.label}
              </Link>
            ))}
            <DiscordButton size="default" className="mt-3 w-full" />
          </div>
        </nav>
      )}
    </header>
  );
}
