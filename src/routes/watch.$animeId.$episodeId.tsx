import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Lock, Play, Loader2, FastForward, Star } from "lucide-react";
import { toast } from "sonner";
import { getAnime, subscribeEpisodes } from "../lib/anime-api";
import type { Anime, Episode } from "../lib/types";
import { Skeleton } from "../components/Skeleton";
import { Comments } from "../components/Comments";
import { useAuth } from "../lib/auth-context";
import { recordHistory } from "../lib/history";
import { saveWatchProgress, rateEpisode } from "../lib/progress";

export const Route = createFileRoute("/watch/$animeId/$episodeId")({
  component: WatchPage,
  head: () => ({ meta: [{ title: "Watch — AnimePlay" }] }),
});

type ServerKey = "s1" | "s2" | "s3";
const VIP_DELAY_MS = 30 * 60 * 1000;

function WatchPage() {
  const { animeId, episodeId } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [anime, setAnime] = useState<Anime | null | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [server, setServer] = useState<ServerKey>("s1");
  const [now, setNow] = useState(Date.now());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    getAnime(animeId).then(setAnime);
    return subscribeEpisodes(animeId, setEpisodes);
  }, [animeId]);

  // Auto-rotate to landscape when entering native iframe fullscreen on mobile
  useEffect(() => {
    const handleFullscreenChange = async () => {
      if (document.fullscreenElement) {
        const orient = (window.screen as any)?.orientation;
        if (orient?.lock) {
          try { await orient.lock("landscape"); } catch {}
        }
      } else {
        const orient = (window.screen as any)?.orientation;
        if (orient?.unlock) { try { orient.unlock(); } catch {} }
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
  useEffect(() => { setPlayerLoading(true); setCurrentTime(0); setDuration(0); }, [server, episodeId]);

  // Resume + progress saving for native <video> player
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const resumeAt = profile?.watchProgress?.[episodeId]?.lastMinute;
    const onMeta = () => {
      setDuration(v.duration || 0);
      if (resumeAt && v.duration && resumeAt < v.duration - 5) {
        try { v.currentTime = resumeAt; } catch {}
      }
    };
    const onTime = () => setCurrentTime(v.currentTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [server, episodeId, profile?.watchProgress]);

  // Throttle save progress every 10s and on unmount
  useEffect(() => {
    if (!user || !duration || locked) return;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused) return;
      saveWatchProgress(user.uid, episodeId, {
        lastMinute: Math.floor(v.currentTime),
        percentage: Math.min(100, Math.floor((v.currentTime / duration) * 100)),
      }).catch(() => {});
    }, 10000);
    return () => {
      clearInterval(id);
      const v = videoRef.current;
      if (v && v.duration) {
        saveWatchProgress(user.uid, episodeId, {
          lastMinute: Math.floor(v.currentTime),
          percentage: Math.min(100, Math.floor((v.currentTime / v.duration) * 100)),
        }).catch(() => {});
      }
    };
  }, [user, duration, episodeId, locked]);

  const seekTo = (sec: number) => {
    const v = videoRef.current;
    if (v) { try { v.currentTime = sec; v.play(); } catch {} }
    else toast("Seek only works on the native player (Server 3 .mp4).");
  };

  const skipStart = current?.skipStart ?? 0;
  const skipEnd = current?.skipEnd ?? 0;
  const showSkip =
    skipEnd > skipStart && currentTime >= skipStart && currentTime < skipEnd && !!videoRef.current;

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
            ref={videoRef}
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
        <div className="mb-2 text-3xl">📡</div>
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
            {showSkip && (
              <button
                type="button"
                onClick={() => seekTo(skipEnd)}
                className="absolute bottom-16 right-3 md:bottom-20 md:right-6 inline-flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-primary hover:ring-primary transition animate-fade-in"
              >
                <FastForward className="h-4 w-4" /> Skip Intro
              </button>
            )}
          </>
        )}
      </div>

      {current && !locked && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs uppercase tracking-wider text-muted-foreground">Server</span>
          {servers.filter((s) => s.available).map((s) => (
            <button
              key={s.k}
              onClick={() => setServer(s.k)}
              className={
                "rounded-xl px-4 py-2 text-sm font-medium transition glass " +
                (server === s.k ? "bg-primary/20 text-foreground ring-1 ring-primary" : "text-muted-foreground hover:text-foreground")
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {anime && current && (
        <div className="mt-6">
          <h1 className="text-xl md:text-2xl font-bold flex flex-wrap items-center gap-2">
            {anime.title} <span className="text-muted-foreground font-normal">— Episode {current.number}</span>
            {current.vip_only && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-black"
                style={{ background: "linear-gradient(135deg,#FDE68A,#F59E0B)" }}>VIP</span>
            )}
            {anime.globalRating ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-400/30">
                <Star className="h-3 w-3 fill-current" /> {anime.globalRating.toFixed(1)}
              </span>
            ) : null}
          </h1>
          {current.title && <p className="mt-1 text-sm text-muted-foreground">{current.title}</p>}
        </div>
      )}

      {/* Episode rating */}
      {user && current && !locked && !current.ratings?.[user.uid] && (
        <RatingPicker
          onPick={async (score) => {
            try {
              await rateEpisode(episodeId, animeId, user.uid, score);
              toast.success("Thanks for rating!");
            } catch (e: any) {
              toast.error(e?.message ?? "Failed to rate");
            }
          }}
        />
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Episodes</h2>
        {episodes === null ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : episodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">No episodes yet.</div>
        ) : (
          <ul className="space-y-2">
            {episodes.map((ep) => {
              const active = ep.id === episodeId;
              return (
                <li key={ep.id}>
                  <button
                    onClick={() => navigate({ to: "/watch/$animeId/$episodeId", params: { animeId, episodeId: ep.id } })}
                    className={"flex w-full items-center gap-3 rounded-xl p-3 text-left transition ring-1 " +
                      (active ? "bg-primary/15 ring-primary/50" : "bg-card ring-white/5 hover:ring-primary/30")}
                  >
                    <div className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-lg " +
                      (active ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary")}>
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">
                          Episode {ep.number}
                          {ep.title ? <span className="text-muted-foreground"> — {ep.title}</span> : null}
                        </span>
                        {ep.vip_only && (
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-black"
                            style={{ background: "linear-gradient(135deg,#FDE68A,#F59E0B)" }}>VIP</span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[ep.server1_data || ep.dailymotion_id, ep.server2_data || ep.okru_id, ep.server3_data].filter(Boolean).length || 0} server(s)
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Comments episodeId={episodeId} onSeek={seekTo} />
    </main>
  );
}

function RatingPicker({ onPick }: { onPick: (score: number) => void | Promise<void> }) {
  const [hover, setHover] = useState(0);
  const [picked, setPicked] = useState(0);
  const [busy, setBusy] = useState(false);
  const submit = async (n: number) => {
    if (busy) return;
    setBusy(true);
    setPicked(n);
    try { await onPick(n); } finally { setBusy(false); }
  };
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-white/5">
      <span className="text-sm font-semibold">Rate this episode:</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || picked) >= n;
          return (
            <button
              key={n}
              type="button"
              disabled={busy}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => submit(n)}
              aria-label={`${n} stars`}
              className="p-1 transition hover:scale-110 disabled:opacity-50"
            >
              <Star className={"h-6 w-6 md:h-7 md:w-7 " + (active ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
            </button>
          );
        })}
      </div>
      {busy && <span className="text-xs text-muted-foreground">Saving…</span>}
    </div>
  );
}
