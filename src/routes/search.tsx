import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { subscribeAnimes } from "../lib/anime-api";
import type { Anime } from "../lib/types";
import { AnimeCard } from "../components/AnimeCard";
import { Skeleton } from "../components/Skeleton";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "Search — AnimePlay" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [animes, setAnimes] = useState<Anime[] | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => subscribeAnimes(setAnimes), []);

  // Show premium skeleton ~1.5s on every new query
  useEffect(() => {
    setShowSkeleton(true);
    const t = setTimeout(() => setShowSkeleton(false), 1500);
    return () => clearTimeout(t);
  }, [q]);

  const results = useMemo(() => {
    if (!animes || !q) return [];
    const needle = q.toLowerCase();
    return animes.filter((a) => {
      const t = (a.title || "").toLowerCase();
      const d = (a.description || "").toLowerCase();
      return t.includes(needle) || d.includes(needle);
    });
  }, [animes, q]);

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-12">
      <h1 className="text-xl font-bold">Hasil Pencarian</h1>
      <p className="mt-1 text-sm text-muted-foreground">"{q}"</p>

      {!q ? (
        <div className="mt-10 text-center text-sm text-muted-foreground">
          Ketik di kolom pencarian lalu tekan Enter.
        </div>
      ) : showSkeleton || animes === null ? (
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="mt-20 text-center text-sm text-muted-foreground">
          Pencarian '{q}' tidak ditemukan.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {results.map((a) => (
            <AnimeCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </main>
  );
}
