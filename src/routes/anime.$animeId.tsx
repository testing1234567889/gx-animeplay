import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Play, Star } from "lucide-react";
import { toast } from "sonner";
import { getAnime, subscribeEpisodes } from "../lib/anime-api";
import type { Anime, Episode } from "../lib/types";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../lib/auth-context";
import { addBookmark, removeBookmark, isBookmarkedOnce } from "../lib/bookmarks";

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
  const { user } = useAuth();
  const [bm, setBm] = useState(false);
  const [bmBusy, setBmBusy] = useState(false);

  useEffect(() => {
    getAnime(animeId).then(setAnime);
    const unsub = subscribeEpisodes(animeId, setEpisodes);
    return unsub;
  }, [animeId]);

  useEffect(() => {
    if (anime?.title) document.title = `${anime.title} — AnimePlay`;
  }, [anime?.title]);

  useEffect(() => {
    if (!user) return;
    isBookmarkedOnce(user.uid, animeId).then(setBm);
  }, [user, animeId]);

  const toggleBm = async () => {
    if (!user) return toast.error("Login to bookmark");
    setBmBusy(true);
    try {
      if (bm) {
        await removeBookmark(user.uid, animeId);
        setBm(false);
        toast.success("Removed from bookmarks");
      } else {
        await addBookmark(user.uid, animeId);
        setBm(true);
        toast.success("Bookmarked");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBmBusy(false);
    }
  };

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

  const heroImg = anime.banner_url || anime.poster_url;

  return (
    <main className="pb-12">
      {/* Hero banner */}
      {heroImg && (
        <div className="relative h-56 w-full overflow-hidden md:h-80">
          <img
            src={heroImg}
            alt={anime.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover blur-sm scale-110 opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
      )}

      <div className={"mx-auto max-w-7xl px-4 " + (heroImg ? "-mt-32 md:-mt-40 relative" : "pt-6")}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 md:grid-cols-[240px_1fr]"
        >
          <div className="aspect-[2/3] overflow-hidden rounded-xl bg-card ring-1 ring-white/10 shadow-2xl max-w-[200px] md:max-w-[240px] mx-auto md:mx-0">
            {anime.poster_url ? (
              <img
                src={anime.poster_url}
                alt={anime.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">No poster</div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{anime.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {anime.type && (
                <span className="rounded bg-primary px-2 py-0.5 font-semibold uppercase text-primary-foreground">
                  {anime.type}
                </span>
              )}
              {anime.status && (
                <span className="rounded bg-white/10 px-2 py-0.5 font-medium">{anime.status}</span>
              )}
              {anime.latest_ep != null && anime.latest_ep !== "" && (
                <span className="rounded bg-white/10 px-2 py-0.5 font-medium">
                  Latest: {anime.latest_ep}
                </span>
              )}
            </div>
            {Array.isArray(anime.genres) && anime.genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {anime.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {episodes && episodes[0] && (
                <Link
                  to="/watch/$animeId/$episodeId"
                  params={{ animeId, episodeId: episodes[0].id }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="h-4 w-4 fill-current" /> Watch Episode 1
                </Link>
              )}
              <button
                onClick={toggleBm}
                disabled={bmBusy}
                className={
                  "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold ring-1 transition disabled:opacity-60 " +
                  (bm
                    ? "bg-primary/20 text-primary ring-primary/50"
                    : "bg-card text-foreground ring-white/10 hover:ring-primary/40")
                }
              >
                <Bookmark className={"h-4 w-4 " + (bm ? "fill-current" : "")} />
                {bm ? "Bookmarked" : "Add to Bookmark"}
              </button>
            </div>
            {anime.description && (
              <>
                <h3 className="text-white font-bold text-xl mt-8">Sinopsis {anime.title}</h3>
                <p className="text-slate-300 text-sm md:text-base mt-2 leading-relaxed">{anime.description}</p>
              </>
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
      </div>
    </main>
  );
}
