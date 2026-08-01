import type { Anime } from "../lib/types";
import { AnimeCard } from "./AnimeCard";

export function AnimeRow({ title, items }: { title: string; items: Anime[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-end justify-between">
        <h2 className="text-base md:text-lg font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      {/* Mobile: horizontal scroll */}
      <div className="md:hidden -mx-4 overflow-x-auto no-scrollbar pb-1 px-4">
        <div className="flex gap-2.5 snap-x snap-mandatory">
          {items.map((a) => (
            <div key={a.id} className="w-[128px] sm:w-[140px] shrink-0 snap-start">
              <AnimeCard a={a} />
            </div>
          ))}
        </div>
      </div>
      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-5 gap-3 lg:grid-cols-6">
        {items.map((a) => (
          <AnimeCard key={a.id} a={a} />
        ))}
      </div>
    </section>
  );
}
