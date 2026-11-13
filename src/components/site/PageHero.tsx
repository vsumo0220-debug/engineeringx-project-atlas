import type { ReactNode } from "react";

export function PageHero({ label, title, children }: { label: string; title: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-navy text-navy-foreground">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-page relative py-16 md:py-24">
        <p className="eyebrow mb-4 text-signal-soft">{label}</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-5xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-base leading-relaxed text-navy-muted md:text-lg">{children}</div>}
      </div>
    </section>
  );
}
