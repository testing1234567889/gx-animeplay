import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAnime, subscribeEpisodes } from "../lib/anime-api";
import type { Anime, Episode } from "../lib/types";
import { Skeleton } from "../components/Skeleton";

export const Route = createFileRoute("/anime/$animeId")({
  component: AnimeDetail,
  head: () => ({
    meta: [{ title: "Anime — AnimePlay" }],
  }),
});

function AnimeDetail() {
  const { animeId } = Route.useParams();
  const [anime, setAnime] = useState<Anime | null | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);

  useEffect(() => {
    getAnime(animeId).then(setAnime);
    const unsub = subscribeEpisodes(animeId, setEpisodes);
    return unsub;
  }, [animeId]);

  useEffect(() => {
    if (anime?.title) document.title = `${anime.title} — AnimePlay`;
  }, [anime?.title]);

  if (anime === undefined) {
    return (
      <main className="mx-auto max-w-7xl px-4 pt-6">
        <Skeleton className="aspect-[16/9] w-full" />
      </main>
    );
  }
  if (anime === null) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Anime Not Found</h1>
        <p className="mt-2 text-muted-foreground">This title doesn't exist or has been removed.</p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-[240px_1fr]"
      >
        <div className="aspect-[2/3] overflow-hidden rounded-xl bg-card ring-1 ring-white/5 max-w-[240px]">
          {anime.poster_url ? (
            <img src={anime.poster_url} alt={anime.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">No poster</div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{anime.title}</h1>
          {anime.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{anime.description}</p>
          )}
          {episodes && episodes[0] && (
            <Link
              to="/watch/$animeId/$episodeId"
              params={{ animeId, episodeId: episodes[0].id }}
              className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              ▶ Watch Episode 1
            </Link>
          )}
        </div>
      </motion.div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Episodes</h2>
        {episodes === null ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : episodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
            No episodes yet.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-10">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                to="/watch/$animeId/$episodeId"
                params={{ animeId, episodeId: ep.id }}
                className="flex h-12 items-center justify-center rounded-lg bg-card text-sm font-medium ring-1 ring-white/5 transition hover:bg-primary hover:text-primary-foreground"
              >
                {ep.number}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
