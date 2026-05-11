import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { subscribeAnimes } from "../lib/anime-api";
import type { Anime } from "../lib/types";
import { Skeleton } from "../components/Skeleton";
import { HeroSlider } from "../components/HeroSlider";
import { AnimeRow } from "../components/AnimeRow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AnimePlay — Watch Anime Online" },
      { name: "description", content: "Discover and stream the latest anime in HD on AnimePlay." },
    ],
  }),
  component: Home,
});

function Home() {
  const [animes, setAnimes] = useState<Anime[] | null>(null);

  useEffect(() => {
    const unsub = subscribeAnimes((list) => {
      list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      setAnimes(list);
    });
    return unsub;
  }, []);

  const sections = useMemo(() => {
    const all = animes ?? [];
    return {
      trending: all.filter((a) => a.isTrending),
      latest: all.filter((a) => a.isLatest),
      movies: all.filter((a) => a.isMovie),
      upcoming: all.filter((a) => a.isUpcoming),
    };
  }, [animes]);

  const heroItems = sections.trending.length ? sections.trending : (animes?.slice(0, 5) ?? []);

  return (
    <main className="mx-auto max-w-7xl px-4 pt-4">
      {animes === null ? (
        <Skeleton className="mb-6 aspect-[16/9] md:aspect-[21/9] w-full" />
      ) : (
        <HeroSlider items={heroItems} />
      )}

      {animes === null ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full" />
          ))}
        </div>
      ) : animes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          No anime yet. Open <span className="font-mono text-primary">/admin</span> to add some.
        </div>
      ) : (
        <>
          <AnimeRow title="Terpopuler Hari Ini" items={sections.trending} />
          <AnimeRow title="Rilisan Terbaru" items={sections.latest} />
          <AnimeRow title="Movie" items={sections.movies} />
          <AnimeRow title="Upcoming Donghua" items={sections.upcoming} />
          {sections.trending.length === 0 &&
            sections.latest.length === 0 &&
            sections.movies.length === 0 &&
            sections.upcoming.length === 0 && (
              <AnimeRow title="All Anime" items={animes} />
            )}
        </>
      )}
    </main>
  );
}
