import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getAnime, subscribeEpisodes } from "../lib/anime-api";
import type { Anime, Episode } from "../lib/types";
import { Skeleton } from "../components/Skeleton";

export const Route = createFileRoute("/watch/$animeId/$episodeId")({
  component: WatchPage,
  head: () => ({ meta: [{ title: "Watch — AnimePlay" }] }),
});

type ServerKey = "dm" | "okru";

function WatchPage() {
  const { animeId, episodeId } = Route.useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<Anime | null | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [server, setServer] = useState<ServerKey>("dm");

  useEffect(() => {
    getAnime(animeId).then(setAnime);
    const unsub = subscribeEpisodes(animeId, setEpisodes);
    return unsub;
  }, [animeId]);

  const current = useMemo(
    () => episodes?.find((e) => e.id === episodeId) ?? null,
    [episodes, episodeId],
  );

  // Auto-fallback if selected server is missing
  useEffect(() => {
    if (!current) return;
    if (server === "dm" && !current.dailymotion_id && current.okru_id) setServer("okru");
    if (server === "okru" && !current.okru_id && current.dailymotion_id) setServer("dm");
  }, [current, server]);

  useEffect(() => {
    if (anime?.title && current) {
      document.title = `${anime.title} — Ep ${current.number} | AnimePlay`;
    }
  }, [anime?.title, current]);

  const embedUrl = useMemo(() => {
    if (!current) return null;
    if (server === "dm" && current.dailymotion_id)
      return `https://www.dailymotion.com/embed/video/${current.dailymotion_id}`;
    if (server === "okru" && current.okru_id)
      return `https://ok.ru/videoembed/${current.okru_id}`;
    return null;
  }, [current, server]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
      {/* Breadcrumb */}
      <div className="mb-3 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        {anime ? (
          <Link to="/anime/$animeId" params={{ animeId }} className="hover:text-foreground">
            {anime.title}
          </Link>
        ) : (
          "…"
        )}
        {current && (
          <>
            <span className="mx-2">/</span>
            <span className="text-foreground">Episode {current.number}</span>
          </>
        )}
      </div>

      {/* Player */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl bg-black ring-1 ring-white/10"
      >
        <div className="relative aspect-video w-full">
          {!current ? (
            <Skeleton className="absolute inset-0 rounded-none" />
          ) : embedUrl ? (
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={`${anime?.title ?? "Episode"} — ${current.number}`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <div className="mb-2 text-3xl">📡</div>
              <div className="text-lg font-semibold">Video Offline</div>
              <p className="mt-1 text-sm text-muted-foreground">
                This server has no source for this episode. Try the other server.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Server switcher */}
      {current && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs uppercase tracking-wider text-muted-foreground">Server</span>
          {([
            { k: "dm" as const, label: "Server 1 (DM)", available: !!current.dailymotion_id },
            { k: "okru" as const, label: "Server 2 (OK)", available: !!current.okru_id },
          ]).map((s) => (
            <button
              key={s.k}
              disabled={!s.available}
              onClick={() => setServer(s.k)}
              className={
                "relative rounded-xl px-4 py-2 text-sm font-medium transition glass " +
                (server === s.k ? "text-foreground" : "text-muted-foreground hover:text-foreground") +
                (!s.available ? " opacity-40 cursor-not-allowed" : "")
              }
            >
              {server === s.k && (
                <motion.span
                  layoutId="server-pill"
                  className="absolute inset-0 rounded-xl bg-primary/20 ring-1 ring-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Title */}
      {anime && current && (
        <div className="mt-6">
          <h1 className="text-xl md:text-2xl font-bold">
            {anime.title} <span className="text-muted-foreground">— Episode {current.number}</span>
          </h1>
          {current.title && <p className="mt-1 text-sm text-muted-foreground">{current.title}</p>}
        </div>
      )}

      {/* Episodes */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Episodes</h2>
        {episodes === null ? (
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {episodes.map((ep) => {
              const active = ep.id === episodeId;
              return (
                <button
                  key={ep.id}
                  onClick={() =>
                    navigate({
                      to: "/watch/$animeId/$episodeId",
                      params: { animeId, episodeId: ep.id },
                    })
                  }
                  className={
                    "h-12 rounded-lg text-sm font-medium ring-1 transition " +
                    (active
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card text-foreground ring-white/5 hover:bg-white/10")
                  }
                >
                  {ep.number}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
