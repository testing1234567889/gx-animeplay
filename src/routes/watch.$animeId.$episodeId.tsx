import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Lock, Maximize, Minimize } from "lucide-react";
import { getAnime, subscribeEpisodes } from "../lib/anime-api";
import type { Anime, Episode } from "../lib/types";
import { Skeleton } from "../components/Skeleton";
import { Comments } from "../components/Comments";
import { useAuth } from "../lib/auth-context";
import { recordHistory } from "../lib/history";

export const Route = createFileRoute("/watch/$animeId/$episodeId")({
  component: WatchPage,
  head: () => ({ meta: [{ title: "Watch — AnimePlay" }] }),
});

type ServerKey = "dm" | "okru";
const VIP_DELAY_MS = 30 * 60 * 1000;

function WatchPage() {
  const { animeId, episodeId } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [anime, setAnime] = useState<Anime | null | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [server, setServer] = useState<ServerKey>("dm");
  const [now, setNow] = useState(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange as any);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange as any);
    };
  }, []);

  const toggleFullscreen = () => {
    const elem: any = playerContainerRef.current;
    if (!elem) return;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => {
    getAnime(animeId).then(setAnime);
    return subscribeEpisodes(animeId, setEpisodes);
  }, [animeId]);

  const current = useMemo(() => episodes?.find((e) => e.id === episodeId) ?? null, [episodes, episodeId]);
  const videoId = current?.dailymotion_id ?? "";

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.setAttribute("allowfullscreen", "true");
      iframeRef.current.setAttribute("webkitallowfullscreen", "true");
      iframeRef.current.setAttribute("mozallowfullscreen", "true");
      iframeRef.current.setAttribute("allow", "autoplay; fullscreen; picture-in-picture; web-share");
    }
  }, [videoId]);

  useEffect(() => {
    if (!current) return;
    if (server === "dm" && !current.dailymotion_id && current.okru_id) setServer("okru");
    if (server === "okru" && !current.okru_id && current.dailymotion_id) setServer("dm");
  }, [current, server]);

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

  const embedUrl = useMemo(() => {
    if (!current || locked) return null;
    if (server === "dm" && current.dailymotion_id)
      return `https://www.dailymotion.com/embed/video/${current.dailymotion_id}?autoplay=0&fullscreen=1`;
    if (server === "okru" && current.okru_id) return `https://ok.ru/videoembed/${current.okru_id}`;
    return null;
  }, [current, server, locked]);

  const fmt = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

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

      <div ref={playerContainerRef} className="relative group w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
        <div className="relative aspect-video w-full">
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
          ) : server === "dm" && videoId ? (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                src={`https://www.dailymotion.com/embed/video/${videoId}?autoplay=0`}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                title="Dailymotion Player"
              ></iframe>
            </div>
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 h-full w-full border-0"
              frameBorder="0"
              allow="fullscreen; picture-in-picture"
              allowFullScreen={true}
              title="Video Player"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <div className="mb-2 text-3xl">📡</div>
              <div className="text-lg font-semibold">Video Offline</div>
              <p className="mt-1 text-sm text-muted-foreground">Try the other server.</p>
            </div>
          )}
        </div>
      </div>

      {current && !locked && (
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
                "rounded-xl px-4 py-2 text-sm font-medium transition glass " +
                (server === s.k ? "bg-primary/20 text-foreground ring-1 ring-primary" : "text-muted-foreground hover:text-foreground") +
                (!s.available ? " opacity-40 cursor-not-allowed" : "")
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
          </h1>
          {current.title && <p className="mt-1 text-sm text-muted-foreground">{current.title}</p>}
        </div>
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
                    <div className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold " +
                      (active ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary")}>▶</div>
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
                        {ep.dailymotion_id ? "DM" : ""}{ep.dailymotion_id && ep.okru_id ? " · " : ""}{ep.okru_id ? "OK" : ""}
                        {!ep.dailymotion_id && !ep.okru_id ? "No source" : " available"}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Comments episodeId={episodeId} />
    </main>
  );
}
