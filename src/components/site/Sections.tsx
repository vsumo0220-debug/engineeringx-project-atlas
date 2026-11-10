import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOALS } from "@/lib/site";
import { DiscordButton } from "./DiscordButton";
import { SectionHeading } from "./SiteLayout";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-navy-foreground">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-page relative py-24 md:py-32">
        <p className="eyebrow mb-6 text-signal-soft">Independent · Student-led Engineering</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl">
          Engineering Beyond Boundaries.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-navy-muted md:text-lg">
          EngineeringX is an independent, student-led engineering organization built around innovation,
          collaboration, and practical engineering. We bring together students interested in technology,
          software, robotics, electronics, mechanical engineering, and design to turn ideas into real projects.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary">
            <Link to="/projects">
              Explore Projects
              <ArrowRight />
            </Link>
          </Button>
          <DiscordButton variant="navy-outline" />
        </div>
      </div>
    </section>
  );
}

export function Introduction() {
  return (
    <section className="border-b">
      <div className="container-page grid gap-10 py-20 md:grid-cols-[1fr_1.3fr] md:py-28">
        <SectionHeading label="About" title="What is EngineeringX?" />
        <p className="text-lg leading-relaxed text-muted-foreground md:pt-8">
          EngineeringX is a community where curious minds come together to explore engineering, develop
          technical skills, and build meaningful projects. We believe engineering is best learned through
          experimentation, teamwork, and hands-on experience.
        </p>
      </div>
    </section>
  );
}

export function Goals() {
  return (
    <section className="border-b">
      <div className="container-page py-20 md:py-28">
        <SectionHeading label="Our Goals" title="What we work towards." />
        <ol className="mt-12 grid border-t sm:grid-cols-2 lg:grid-cols-4">
          {GOALS.map((goal, i) => (
            <li
              key={goal.title}
              className="border-b py-8 sm:px-6 sm:odd:pl-0 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0"
            >
              <span className="eyebrow text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{goal.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{goal.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function JoinSection() {
  return (
    <section className="bg-navy text-navy-foreground">
      <div className="container-page flex flex-col gap-8 py-20 md:flex-row md:items-end md:justify-between md:py-24">
        <div className="max-w-2xl space-y-4">
          <p className="eyebrow text-signal-soft">Join EngineeringX</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Build Something With Us.</h2>
          <p className="text-base leading-relaxed text-navy-muted md:text-lg">
            Interested in engineering, robotics, software, or technology? Join EngineeringX and become part of a
            community that turns ideas into reality.
          </p>
        </div>
        <DiscordButton className="shrink-0" />
      </div>
    </section>
  );
}
