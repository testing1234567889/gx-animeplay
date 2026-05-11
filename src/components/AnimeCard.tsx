import { Link } from "@tanstack/react-router";
import { Flame, CheckCircle2, Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import type { Anime } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { addBookmark, removeBookmark, isBookmarkedOnce } from "../lib/bookmarks";
import { toast } from "sonner";

type Props = {
  a: Anime;
  showBookmark?: boolean;
  latestEpOverride?: string;
};

export function AnimeCard({ a, showBookmark = true, latestEpOverride }: Props) {
  const { user } = useAuth();
  const [bm, setBm] = useState(false);

  useEffect(() => {
    if (!user) return;
    isBookmarkedOnce(user.uid, a.id).then(setBm);
  }, [user, a.id]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Login to bookmark");
      return;
    }
    try {
      if (bm) {
        await removeBookmark(user.uid, a.id);
        setBm(false);
        toast.success("Removed from bookmarks");
      } else {
        await addBookmark(user.uid, a.id);
        setBm(true);
        toast.success("Bookmarked");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  const completed = (a.status ?? "").toLowerCase() === "completed";

  return (
    <Link
      to="/anime/$animeId"
      params={{ animeId: a.id }}
      className="group block transition-transform duration-200 active:scale-95"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-card ring-1 ring-white/5 transition group-hover:ring-primary/40">
        {a.poster_url ? (
          <img
            src={a.poster_url}
            alt={a.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No poster
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

        {/* Top-Right: type */}
        {a.type && (
          <span className="absolute top-1.5 right-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground shadow">
            {a.type}
          </span>
        )}

        {/* Top-Left: status */}
        {completed ? (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white shadow">
            <CheckCircle2 className="h-3 w-3" /> End
          </span>
        ) : (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center justify-center rounded-md bg-orange-500/90 p-1 shadow">
            <Flame className="h-3 w-3 text-white" />
          </span>
        )}

        {/* Bottom-Left: latest ep */}
        {(latestEpOverride ?? (a.latest_ep != null && a.latest_ep !== "" ? String(a.latest_ep) : "")) && (
          <span className="absolute bottom-1.5 left-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
            {latestEpOverride ?? a.latest_ep}
          </span>
        )}

        {/* Bottom-Right: Sub */}
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-black shadow">
          Sub
        </span>

        {/* Bookmark button */}
        {showBookmark && (
          <button
            type="button"
            onClick={toggleBookmark}
            aria-label="Bookmark"
            className={
              "absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full p-1.5 backdrop-blur-md ring-1 transition opacity-0 group-hover:opacity-100 active:opacity-100 " +
              (bm
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-black/50 text-white ring-white/20 hover:bg-primary hover:ring-primary")
            }
          >
            <Bookmark className={"h-3.5 w-3.5 " + (bm ? "fill-current" : "")} />
          </button>
        )}

        {/* Global rating badge */}
        {a.globalRating ? (
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-300/30 backdrop-blur-sm">
            <Star className="h-2.5 w-2.5 fill-current" /> {a.globalRating.toFixed(1)}
          </span>
        ) : null}

        {/* Watch progress */}
        {progress != null && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div
              className="h-full bg-red-600"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
      <div className="mt-1.5 line-clamp-2 text-xs sm:text-sm font-medium text-foreground">
        {a.title}
      </div>
    </Link>
  );
}
