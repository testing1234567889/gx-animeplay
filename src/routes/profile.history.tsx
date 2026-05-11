import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, History as HistoryIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { subscribeHistory, clearHistoryItem, type HistoryItem } from "../lib/history";

export const Route = createFileRoute("/profile/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "Watch History — AnimePlay" }] }),
});

function HistoryPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    return subscribeHistory(user.uid, setItems);
  }, [user, loading, navigate]);

  const onClear = async (animeId: string) => {
    if (!user) return;
    try {
      await clearHistoryItem(user.uid, animeId);
      toast.success("Removed");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  if (loading) return <main className="px-4 pt-10 text-center text-sm text-muted-foreground">Loading…</main>;

  return (
    <main className="mx-auto max-w-2xl px-4 pt-4 pb-12 animate-fade-in">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/profile" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 hover:ring-primary/40">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Watch History</h1>
          <p className="text-xs text-muted-foreground">Continue where you left off.</p>
        </div>
      </div>

      {items === null ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          <HistoryIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
          No watch history yet. Start watching some anime!
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((h) => {
            const pct = profile?.watchProgress?.[h.episode_id]?.percentage ?? 0;
            return (
              <li key={h.anime_id} className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-white/5">
                <Link to="/watch/$animeId/$episodeId" params={{ animeId: h.anime_id, episodeId: h.episode_id }} className="flex flex-1 items-center gap-3 min-w-0">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-black/40">
                    {h.poster_url && <img src={h.poster_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
                    {pct > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                        <div className="h-full bg-red-600" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{h.anime_title}</div>
                    <div className="text-xs text-muted-foreground">Episode {h.episode_number}{pct > 0 ? ` • ${pct}%` : ""}</div>
                    <div className="text-[10px] text-muted-foreground/70">{new Date(h.updated_at).toLocaleString()}</div>
                  </div>
                </Link>
                <button
                  onClick={() => onClear(h.anime_id)}
                  aria-label="Remove"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
