import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Anime } from "../lib/types";
import { Play } from "lucide-react";

export function HeroSlider({ items }: { items: Anime[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % items.length), 4500);
    return () => clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;
  const a = items[i];

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl ring-1 ring-white/10 animate-fade-in">
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
        {items.map((it, idx) => (
          <img
            key={it.id}
            src={it.banner_url || it.poster_url}
            alt={it.title}
            className={
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 " +
              (idx === i ? "opacity-100" : "opacity-0")
            }
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-8">
        {a.type && (
          <span className="mb-2 inline-block rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
            {a.type}
          </span>
        )}
        <h1 className="text-xl md:text-4xl font-bold tracking-tight">{a.title}</h1>
        {a.description && (
          <p className="mt-2 max-w-2xl text-xs md:text-sm text-muted-foreground line-clamp-2">
            {a.description}
          </p>
        )}
        <Link
          to="/anime/$animeId"
          params={{ animeId: a.id }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Play className="h-4 w-4 fill-current" /> Watch Now
        </Link>
      </div>
      <div className="absolute bottom-2 right-3 flex gap-1">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={
              "h-1.5 rounded-full transition-all " +
              (idx === i ? "w-5 bg-primary" : "w-1.5 bg-white/40")
            }
          />
        ))}
      </div>
    </section>
  );
}
