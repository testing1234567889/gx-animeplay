import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { subscribeBookmarks } from "../lib/bookmarks";
import { getAnime } from "../lib/anime-api";
import type { Anime } from "../lib/types";
import { AnimeCard } from "../components/AnimeCard";
import { Skeleton } from "../components/Skeleton";

export const Route = createFileRoute("/bookmark")({
  component: BookmarkPage,
  head: () => ({ meta: [{ title: "Bookmarks — AnimePlay" }] }),
});

function BookmarkPage() {
  const { user, loading } = useAuth();
  const [ids, setIds] = useState<string[] | null>(null);
  const [animes, setAnimes] = useState<Anime[] | null>(null);

  useEffect(() => {
    if (!user) {
      setIds(null);
      setAnimes(null);
      return;
    }
    return subscribeBookmarks(user.uid, setIds);
  }, [user]);

  useEffect(() => {
    if (!ids) return;
    Promise.all(ids.map((id) => getAnime(id))).then((list) => {
      setAnimes(list.filter((a): a is Anime => !!a));
    });
  }, [ids]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-10">
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-10 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4 ring-1 ring-primary/30">
            <Bookmark className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Your Bookmarks</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Sign in to save and sync your favourite anime across devices.
          </p>
          <Link
            to="/login"
            className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-32 pt-6 animate-fade-in">
      <h1 className="mb-4 text-2xl font-bold">Your Bookmarks</h1>
      {animes === null ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full" />
          ))}
        </div>
      ) : animes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          No bookmarks yet. Tap the bookmark icon on any anime card to save it.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {animes.map((a) => (
            <AnimeCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </main>
  );
}
