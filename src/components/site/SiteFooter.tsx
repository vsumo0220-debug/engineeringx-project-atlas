import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useDiscordUrl } from "./DiscordButton";
import { SITE_DESCRIPTION } from "@/lib/site";

export function SiteFooter() {
  const discordUrl = useDiscordUrl();
  const year = new Date().getUTCFullYear();
  const linkClass = "text-sm text-navy-muted transition-colors hover:text-navy-foreground";

  return (
    <footer className="bg-navy-deep text-navy-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr]">
        <div className="max-w-sm space-y-4">
          <Logo />
          <p className="text-sm leading-relaxed text-navy-muted">{SITE_DESCRIPTION}</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 md:justify-self-end">
          <Link to="/" className={linkClass}>
            Home
          </Link>
          <Link to="/about" className={linkClass}>
            About
          </Link>
          <Link to="/projects" className={linkClass}>
            Projects
          </Link>
          <a href={discordUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Discord
          </a>
        </nav>
      </div>
      <div className="border-t border-navy-border">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-navy-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} EngineeringX. All rights reserved.</p>
          <p className="font-mono">Independent · Student-led</p>
        </div>
      </div>
    </footer>
  );
}
