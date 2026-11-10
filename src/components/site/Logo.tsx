import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/engineeringx_logo.jpg.asset.json";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      className={cn("size-8 rounded-sm", className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="EngineeringX home">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">
        Engineering<span className="text-signal-soft">X</span>
      </span>
    </Link>
  );
}
