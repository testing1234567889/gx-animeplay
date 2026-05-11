import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ref, get } from "firebase/database";
import { Infinity as InfinityIcon, Heart, MessageSquare, Clock, Bookmark } from "lucide-react";
import { db } from "../lib/firebase";
import type { UserProfile, Anime } from "../lib/types";
import { RoleBadges, rolesFromProfile } from "../components/RoleBadges";
import { Skeleton } from "../components/Skeleton";
import { subscribeAllCommentsByUser, type UserCommentRef } from "../lib/comments";
import { subscribeHistory, type HistoryItem } from "../lib/history";
import { subscribeBookmarks } from "../lib/bookmarks";
import { getAnime } from "../lib/anime-api";

export const Route = createFileRoute("/user/$userId")({
  component: PublicUserProfile,
  head: () => ({ meta: [{ title: "User Profile — AnimePlay" }] }),
});

// Convert UID into a stable 5-digit hash
function uidHash(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  const n = (h % 90000) + 10000;
  return `#${n}`;
}

type Tab = "comments" | "favorite" | "history";

function PublicUserProfile() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [comments, setComments] = useState<UserCommentRef[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [tab, setTab] = useState<Tab>("comments");

  useEffect(() => {
    let cancelled = false;
    get(ref(db, `users/${userId}`)).then((s) => {
      if (cancelled) return;
      if (!s.exists()) return setProfile(null);
      setProfile({ uid: userId, ...(s.val() as object) } as UserProfile);
    });
    const u1 = subscribeAllCommentsByUser(userId, setComments);
    const u2 = subscribeHistory(userId, setHistory);
    const u3 = subscribeBookmarks(userId, setBookmarkIds);
    return () => { cancelled = true; u1(); u2(); u3(); };
  }, [userId]);

  // Load favorite anime metadata
  useEffect(() => {
    let cancelled = false;
    Promise.all(bookmarkIds.map((id) => getAnime(id).catch(() => null))).then((rows) => {
      if (cancelled) return;
      setFavorites(rows.filter((a): a is Anime => !!a));
    });
    return () => { cancelled = true; };
  }, [bookmarkIds]);

  const daysJoined = useMemo(() => {
    if (!profile?.created_at) return 0;
    return Math.max(0, Math.floor((Date.now() - profile.created_at) / 86_400_000));
  }, [profile?.created_at]);

  const isSpecial = !!(profile && (profile.isAdmin || profile.isModerator || profile.status === "vip"));
  const name = profile?.displayName?.trim() || profile?.email?.split("@")[0] || "user";
  const initial = (name[0] ?? "?").toUpperCase();
  const photoURL = profile?.photoURL && /^https:\/\//i.test(profile.photoURL) ? profile.photoURL : "";

  if (profile === undefined) {
    return (
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-24">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </main>
    );
  }
  if (profile === null) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">User Not Found</h1>
        <p className="mt-2 text-muted-foreground">This profile doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pt-8 pb-24">
      {/* Header */}
      <section className="flex flex-col items-center text-center">
        <div className="relative h-24 w-24 md:h-28 md:w-28 overflow-hidden rounded-full bg-primary/20 ring-4 ring-primary/30 shadow-2xl shadow-primary/20">
          {photoURL ? (
            <img
              src={photoURL}
              alt={name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary">
              {initial}
            </div>
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold">{name}</h1>
        <span className="mt-1 font-mono text-xs text-muted-foreground">{uidHash(userId)}</span>
        <div className="mt-3">
          <RoleBadges roles={rolesFromProfile(profile)} size="md" />
        </div>

        {/* Special-role infinity OR friends/level placeholder */}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-xs ring-1 ring-white/10">
          {isSpecial ? (
            <>
              <InfinityIcon className="h-4 w-4 text-primary" />
              <span className="font-semibold">Unlimited Access</span>
            </>
          ) : (
            <>
              <Heart className="h-3.5 w-3.5 text-pink-400" />
              <span>Lvl 1 · 0 friends</span>
            </>
          )}
        </div>
      </section>

      {/* Stats row */}
      <section className="mt-6 grid grid-cols-3 gap-2">
        <StatCard label="Hari bergabung" value={daysJoined} />
        <StatCard label="Jumlah komentar" value={comments.length} />
        <StatCard label="Jumlah riwayat" value={history.length} />
      </section>

      {/* Tabs */}
      <section className="mt-8">
        <div className="grid grid-cols-3 rounded-2xl bg-card p-1 ring-1 ring-white/10">
          {(["comments", "favorite", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "rounded-xl px-3 py-2 text-sm font-semibold capitalize transition " +
                (tab === t
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {t === "comments" ? "Comments" : t === "favorite" ? "Favorite" : "History"}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === "comments" && <CommentsTab rows={comments} />}
          {tab === "favorite" && <FavoriteTab rows={favorites} />}
          {tab === "history" && <HistoryTab rows={history} />}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-card p-4 ring-1 ring-white/10">
      <span className="text-2xl md:text-3xl font-bold text-primary tabular-nums">{value}</span>
      <span className="mt-1 text-[11px] md:text-xs text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

function CommentsTab({ rows }: { rows: UserCommentRef[] }) {
  if (rows.length === 0) return <EmptyState icon={<MessageSquare className="h-6 w-6" />} text="No comments yet." />;
  return (
    <ul className="space-y-2">
      {rows.map((c) => (
        <li key={c.id} className="rounded-xl bg-card p-3 ring-1 ring-white/5">
          <p className="text-sm whitespace-pre-wrap line-clamp-3">{c.text}</p>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {new Date(c.created_at).toLocaleString()}
          </div>
        </li>
      ))}
    </ul>
  );
}

function FavoriteTab({ rows }: { rows: Anime[] }) {
  if (rows.length === 0) return <EmptyState icon={<Bookmark className="h-6 w-6" />} text="No favorites yet." />;
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {rows.map((a) => (
        <li key={a.id}>
          <Link
            to="/anime/$animeId"
            params={{ animeId: a.id }}
            className="block overflow-hidden rounded-xl bg-card ring-1 ring-white/5 transition hover:ring-primary/40"
          >
            <div className="aspect-[2/3] overflow-hidden">
              {a.poster_url ? (
                <img src={a.poster_url} alt={a.title} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No poster</div>
              )}
            </div>
            <div className="p-2">
              <p className="text-sm font-semibold line-clamp-2">{a.title}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function HistoryTab({ rows }: { rows: HistoryItem[] }) {
  if (rows.length === 0) return <EmptyState icon={<Clock className="h-6 w-6" />} text="No watch history yet." />;
  return (
    <ul className="space-y-2">
      {rows.map((h) => (
        <li key={h.anime_id}>
          <Link
            to="/watch/$animeId/$episodeId"
            params={{ animeId: h.anime_id, episodeId: h.episode_id }}
            className="flex gap-3 rounded-xl bg-card p-2 ring-1 ring-white/5 transition hover:ring-primary/40"
          >
            <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-background">
              {h.poster_url ? (
                <img src={h.poster_url} alt={h.anime_title} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{h.anime_title}</p>
              <p className="text-xs text-muted-foreground">Episode {h.episode_number}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(h.updated_at).toLocaleString()}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 p-8 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
