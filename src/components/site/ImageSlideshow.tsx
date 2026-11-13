import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageSlideshow({ images, alt }: { images: string[]; alt: string }) {
  const list = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const count = list.length;
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  return (
    <div
      className="group relative overflow-hidden rounded-md border bg-muted"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${alt} images`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
    >
      <div className="aspect-[16/9] w-full">
        <img
          key={list[index]}
          src={list[index]}
          alt={`${alt} — image ${index + 1} of ${count}`}
          className="size-full object-cover"
        />
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-sm bg-navy/80 text-navy-foreground transition-colors hover:bg-navy"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next image"
            className="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-sm bg-navy/80 text-navy-foreground transition-colors hover:bg-navy"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute right-3 top-3 rounded-sm bg-navy/80 px-2 py-1 font-mono text-xs text-navy-foreground">
            {index + 1} / {count}
          </div>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {list.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "size-2.5 rounded-full border border-navy-foreground/70 transition-colors",
                  i === index ? "bg-navy-foreground" : "bg-navy/60 hover:bg-navy-foreground/60",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
