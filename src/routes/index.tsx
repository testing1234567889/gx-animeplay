import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { subscribeAnimes } from "../lib/anime-api";
import type { Anime } from "../lib/types";
import { Skeleton } from "../components/Skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AnimePlay — Watch Anime Online" },
      { name: "description", content: "Discover and stream the latest anime in HD on AnimePlay." },
    ],
  }),
  component: Home,
});

function PosterCard({ a }: { a: Anime }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group"
    >
      <Link to="/anime/$animeId" params={{ animeId: a.id }} className="block">
        <div className="aspect-[2/3] overflow-hidden rounded-xl bg-card ring-1 ring-white/5">
          {a.poster_url ? (
            <img
              src={a.poster_url}
              alt={a.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No poster
            </div>
          )}
        </div>
        <div className="mt-2 line-clamp-2 text-sm font-medium text-foreground">{a.title}</div>
      </Link>
    </motion.div>
  );
}

function Home() {
  const [animes, setAnimes] = useState<Anime[] | null>(null);

  useEffect(() => {
    const unsub = subscribeAnimes((list) => {
      list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      setAnimes(list);
    });
    return unsub;
  }, []);

  const featured = animes?.[0];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6">
      {/* Hero */}
      {featured ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 overflow-hidden rounded-2xl ring-1 ring-white/10"
        >
          <div className="aspect-[16/9] md:aspect-[21/9] w-full">
            {featured.poster_url ? (
              <img src={featured.poster_url} alt={featured.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-card" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{featured.title}</h1>
            {featured.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground line-clamp-2">{featured.description}</p>
            )}
            <Link
              to="/anime/$animeId"
              params={{ animeId: featured.id }}
              className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Watch Now
            </Link>
          </div>
        </motion.section>
      ) : (
        <Skeleton className="mb-8 aspect-[16/9] md:aspect-[21/9] w-full" />
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Recently Added</h2>
          <span className="text-xs text-muted-foreground">{animes?.length ?? ""} titles</span>
        </div>

        {animes === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full" />
            ))}
          </div>
        ) : animes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
            No anime yet. Add some from the <Link to="/admin" className="text-primary underline">Admin</Link> dashboard.
          </div>
        ) : (
          <>
            {/* Mobile: horizontal rail */}
            <div className="md:hidden -mx-4 overflow-x-auto no-scrollbar px-4">
              <div className="flex gap-3 snap-x snap-mandatory">
                {animes.map((a) => (
                  <div key={a.id} className="w-36 shrink-0 snap-start">
                    <PosterCard a={a} />
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop grid */}
            <div className="hidden md:grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {animes.map((a) => (
                <PosterCard key={a.id} a={a} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
