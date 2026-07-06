import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Crown, Lock, Loader2, Server as ServerIcon, Download, Flag } from "lucide-react";
import { toast } from "sonner";
import { getAnime, subscribeEpisodes } from "../lib/anime-api";
import { reportVideo } from "../lib/progress";
import { getVipEmbed } from "../lib/vip-embed.functions";
import { auth } from "../lib/firebase";
import type { Anime, Episode } from "../lib/types";
import { Skeleton } from "../components/Skeleton";
import { Comments } from "../components/Comments";
import { useAuth } from "../lib/auth-context";
import { recordHistory } from "../lib/history";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "../components/ui/dialog";

type EmbedPayload = {
  server1_data: string;
  server2_data: string;
  server3_data: string;
  server1_name: string;
  server2_name: string;
  server3_name: string;
  download_url: string;
};

export const Route = createFileRoute("/watch/$animeId/$episodeId")({
  component: WatchPage,
  head: () => ({ meta: [{ title: "Watch — AnimePlay" }] }),
});

type ServerKey = "s1" | "s2" | "s3";
const VIP_DELAY_MS = 30 * 60 * 1000;
const VIDEO_REASONS = ["Video Error", "Subtitle Rusak", "Salah Video", "Other"] as const;
type VideoReason = (typeof VIDEO_REASONS)[number];

function WatchPage() {
  const { animeId, episodeId } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [anime, setAnime] = useState<Anime | null | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [server, setServer] = useState<ServerKey>("s1");
  const [now, setNow] = useState(Date.now());
  const [synopsisOpen, setSynopsisOpen] = useState(false);
  const [serverDialog, setServerDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);

  useEffect(() => {
    getAnime(animeId).then(setAnime);
    return subscribeEpisodes(animeId, setEpisodes);
  }, [animeId]);

  // Auto-rotate landscape on native iframe fullscreen
  useEffect(() => {
    const handle = async () => {
      const orient = (window.screen as any)?.orientation;
      if (document.fullscreenElement) {
        if (orient?.lock) { try { await orient.lock("landscape"); } catch {} }
      } else {
        if (orient?.unlock) { try { orient.unlock(); } catch {} }
      }
    };
    document.addEventListener("fullscreenchange", handle);
    return () => document.removeEventListener("fullscreenchange", handle);
  }, []);

  const current = useMemo(() => episodes?.find((e) => e.id === episodeId) ?? null, [episodes, episodeId]);

  const s1Data = current?.server1_data || current?.dailymotion_id || "";
  const s2Data = current?.server2_data || current?.okru_id || "";
  const s3Data = current?.server3_data || "";
  const s1Name = current?.server1_name?.trim() || "Server 1";
  const s2Name = current?.server2_name?.trim() || "Server 2";
  const s3Name = current?.server3_name?.trim() || "Server 3";

  const availability: Record<ServerKey, string> = { s1: s1Data, s2: s2Data, s3: s3Data };

  useEffect(() => {
    if (!current) return;
    if (!availability[server]) {
      const fallback = (["s1", "s2", "s3"] as ServerKey[]).find((k) => !!availability[k]);
      if (fallback) setServer(fallback);
    }
  }, [current, server, availability]);

  useEffect(() => {
    if (anime?.title && current) document.title = `${anime.title} — Ep ${current.number} | AnimePlay`;
  }, [anime?.title, current]);

  // VIP gating
  const isVip = profile?.status === "vip";
  const release = current?.release_time ?? current?.created_at ?? 0;
  const unlockAt = release + VIP_DELAY_MS;
  const locked = !!current?.vip_only && !isVip && now < unlockAt;
  const remainingMs = Math.max(0, unlockAt - now);

  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [locked]);

  // History
  useEffect(() => {
    if (!user || !anime || !current || locked) return;
    recordHistory(user.uid, {
      anime_id: animeId,
      episode_id: episodeId,
      episode_number: current.number,
      anime_title: anime.title,
      poster_url: anime.poster_url,
      updated_at: Date.now(),
    }).catch(() => {});
  }, [user, anime, current, animeId, episodeId, locked]);

  const fmt = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const [playerLoading, setPlayerLoading] = useState(true);
  useEffect(() => { setPlayerLoading(true); }, [server, episodeId]);

  const renderPlayer = () => {
    if (!current) return null;
    const onLoad = () => setPlayerLoading(false);
    if (server === "s1" && s1Data)
      return (
        <iframe
          src={`https://geo.dailymotion.com/player/xid0t.html?video=${s1Data}&autoplay=0`}
          allow="autoplay; fullscreen; picture-in-picture; web-share"
          allowFullScreen
          onLoad={onLoad}
          className="w-full h-full absolute inset-0"
          frameBorder="0"
          title="Server 1"
        />
      );
    if (server === "s2" && s2Data)
      return (
        <iframe
          src={`https://ok.ru/videoembed/${s2Data}`}
          allowFullScreen
          onLoad={onLoad}
          className="w-full h-full absolute inset-0"
          frameBorder="0"
          title="Server 2"
        />
      );
    if (server === "s3" && s3Data) {
      const isMp4 = s3Data.toLowerCase().split("?")[0].endsWith(".mp4");
      if (isMp4) {
        return (
          <video
            src={s3Data}
            controls
            playsInline
            onLoadedData={onLoad}
            onCanPlay={onLoad}
            className="w-full h-full absolute inset-0 bg-black"
          />
        );
      }
      return (
        <iframe
          src={s3Data}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={onLoad}
          className="w-full h-full absolute inset-0"
          frameBorder="0"
          title="Server 3"
        />
      );
    }
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <div className="text-lg font-semibold">Video Offline</div>
        <p className="mt-1 text-sm text-muted-foreground">Try another server.</p>
      </div>
    );
  };

  const servers: { k: ServerKey; label: string; available: boolean }[] = [
    { k: "s1", label: s1Name, available: !!s1Data },
    { k: "s2", label: s2Name, available: !!s2Data },
    { k: "s3", label: s3Name, available: !!s3Data },
  ];
  const activeServerLabel = servers.find((s) => s.k === server)?.label ?? "Server";
  const downloadUrl = current?.download_url?.trim() || "";

  // Synopsis clamp logic
  const synopsis = anime?.description ?? "";
  const isLongSynopsis = synopsis.length > 140;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
      <div className="mb-3 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        {anime ? (
          <Link to="/anime/$animeId" params={{ animeId }} className="hover:text-foreground">{anime.title}</Link>
        ) : "…"}
        {current && (<><span className="mx-2">/</span><span className="text-foreground">Episode {current.number}</span></>)}
      </div>

      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {!current ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : locked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            style={{ background: "radial-gradient(ellipse at center,rgba(245,158,11,0.18),transparent 70%)" }}>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/20 ring-1 ring-yellow-400/40">
              <Lock className="h-6 w-6 text-yellow-300" />
            </div>
            <div className="text-lg font-bold">VIP Early Access</div>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Free users can watch in <span className="font-mono font-bold text-yellow-300">{fmt(remainingMs)}</span>.
              Go VIP to unlock instantly.
            </p>
            <Link to="/upgrade" className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-black"
              style={{ background: "linear-gradient(135deg,#FDE68A,#F59E0B,#B45309)" }}>
              <Crown className="h-4 w-4" /> Upgrade to VIP
            </Link>
          </div>
        ) : (
          <>
            {renderPlayer()}
            {playerLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Header info: poster + title + episode title */}
      {anime && current && (
        <div className="mt-4 flex gap-3">
          {anime.poster_url ? (
            <Link
              to="/anime/$animeId"
              params={{ animeId }}
              className="block w-16 h-24 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10"
            >
              <img
                src={anime.poster_url}
                alt={anime.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </Link>
          ) : null}
          <div className="min-w-0 flex-1">
            <Link to="/anime/$animeId" params={{ animeId }} className="block">
              <h1 className="text-lg md:text-xl font-bold leading-tight hover:text-primary transition truncate">
                {anime.title}
              </h1>
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Episode {current.number}
              {current.title ? <span> — {current.title}</span> : null}
            </p>
            {current.vip_only && (
              <span className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold text-black"
                style={{ background: "linear-gradient(135deg,#FDE68A,#F59E0B)" }}>VIP</span>
            )}
          </div>
        </div>
      )}

      {/* Expandable synopsis */}
      {synopsis && (
        <div className="mt-4">
          <p className={"text-sm text-slate-300 leading-relaxed whitespace-pre-wrap " + (synopsisOpen || !isLongSynopsis ? "" : "line-clamp-2")}>
            {synopsis}
          </p>
          {isLongSynopsis && (
            <button
              onClick={() => setSynopsisOpen((v) => !v)}
              className="mt-1 text-sm font-semibold text-blue-500 hover:text-blue-400"
            >
              {synopsisOpen ? "Tutup ‹" : "Baca semua ›"}
            </button>
          )}
        </div>
      )}

      {/* Action button row */}
      {current && !locked && (
        <div className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          <button
            onClick={() => setServerDialog(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-semibold ring-1 ring-white/10 hover:ring-primary/40 transition"
          >
            <ServerIcon className="h-4 w-4" />
            <span className="truncate">{activeServerLabel}</span>
          </button>
          <a
            href={downloadUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!downloadUrl}
            onClick={(e) => { if (!downloadUrl) { e.preventDefault(); toast.info("Download not available"); } }}
            className={
              "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition " +
              (downloadUrl
                ? "bg-primary/15 text-primary ring-primary/40 hover:bg-primary/25"
                : "bg-card text-muted-foreground ring-white/10")
            }
          >
            <Download className="h-4 w-4" /> Download
          </a>
          <button
            onClick={() => {
              if (!user) return toast.error("Sign in to report");
              setReportDialog(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-semibold ring-1 ring-white/10 hover:ring-amber-400/40 hover:text-amber-400 transition"
          >
            <Flag className="h-4 w-4" /> Report
          </button>
        </div>
      )}

      {/* Horizontal episode navigation */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Episodes</h2>
        {episodes === null ? (
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-12 shrink-0" />)}
          </div>
        ) : episodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
            No episodes yet.
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin scroll-smooth snap-x">
            {episodes.map((ep) => {
              const active = ep.id === episodeId;
              return (
                <button
                  key={ep.id}
                  onClick={() => navigate({ to: "/watch/$animeId/$episodeId", params: { animeId, episodeId: ep.id } })}
                  className={
                    "relative flex h-12 min-w-[3rem] shrink-0 snap-start items-center justify-center rounded-xl px-3 text-sm font-bold ring-1 transition " +
                    (active
                      ? "bg-primary text-primary-foreground ring-primary shadow-lg shadow-primary/40 scale-105"
                      : "bg-card text-foreground/80 ring-white/10 hover:ring-primary/40")
                  }
                  title={ep.title || `Episode ${ep.number}`}
                >
                  {ep.number}
                  {ep.vip_only && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-yellow-400 ring-2 ring-background" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <Comments episodeId={episodeId} />

      {/* Server selection dialog */}
      <Dialog open={serverDialog} onOpenChange={setServerDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pilih Server</DialogTitle>
            <DialogDescription>Switch streaming source if the current one is offline.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {servers.filter((s) => s.available).map((s) => (
              <button
                key={s.k}
                onClick={() => { setServer(s.k); setServerDialog(false); }}
                className={
                  "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ring-1 transition " +
                  (server === s.k
                    ? "bg-primary/20 text-primary ring-primary/50"
                    : "bg-card ring-white/10 hover:ring-primary/40")
                }
              >
                <span className="inline-flex items-center gap-2"><ServerIcon className="h-4 w-4" /> {s.label}</span>
                {server === s.k && <span className="text-[11px] uppercase">Active</span>}
              </button>
            ))}
            {servers.filter((s) => s.available).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No servers available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video report dialog */}
      <VideoReportDialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        animeId={animeId}
        episodeId={episodeId}
        reporterUid={user?.uid ?? ""}
      />
    </main>
  );
}

function VideoReportDialog({
  open, onClose, animeId, episodeId, reporterUid,
}: {
  open: boolean;
  onClose: () => void;
  animeId: string;
  episodeId: string;
  reporterUid: string;
}) {
  const [reason, setReason] = useState<VideoReason>("Video Error");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setReason("Video Error"); setCustom(""); }
  }, [open]);

  const submit = async () => {
    if (!reporterUid) return;
    if (reason === "Other" && !custom.trim()) return toast.error("Describe the issue");
    setBusy(true);
    try {
      await reportVideo({
        animeId, episodeId, reporterUid,
        reason,
        customText: reason === "Other" ? custom.trim() : undefined,
      });
      toast.success("Thanks — moderators have been notified.");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Laporkan Video</DialogTitle>
          <DialogDescription>Bantu kami memperbaiki masalah pada episode ini.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {VIDEO_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={
                "rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition " +
                (reason === r
                  ? "bg-primary/20 text-primary ring-primary/50"
                  : "bg-card text-foreground/80 ring-white/10 hover:ring-primary/30")
              }
            >
              {r}
            </button>
          ))}
        </div>
        {reason === "Other" && (
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Jelaskan masalahnya (max 200 chars)"
            className="input resize-none"
          />
        )}
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-card px-4 py-2 text-sm ring-1 ring-white/10 hover:ring-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit Report"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
