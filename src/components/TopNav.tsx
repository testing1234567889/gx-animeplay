import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { subscribeSiteLogo } from "../lib/settings";
import { subscribeAnimes } from "../lib/anime-api";
import type { Anime } from "../lib/types";

export function TopNav() {
  const [logo, setLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const [marquee, setMarquee] = useState<string>("");
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    return subscribeSiteLogo((url) => {
      setLogo(url);
      setLogoLoading(false);
    });
  }, []);

  useEffect(() => {
    return subscribeAnimes((list: Anime[]) => {
      const latest = [...list]
        .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
        .slice(0, 12)
        .map((a) => `${a.title}${a.latest_ep ? ` • Ep ${a.latest_ep}` : ""}`);
      setMarquee(latest.join("   ✦   "));
    });
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate({ to: "/search", search: { q: term } });
  };

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {logo ? (
            <img
              src={logo}
              alt="AnimePlay"
              referrerPolicy="no-referrer"
              draggable={false}
              className="h-7 w-auto max-w-[140px] object-contain"
            />
          ) : logoLoading ? (
            <div className="h-7 w-7 rounded-md bg-white/10 animate-pulse" />
          ) : (
            <>
              <div className="h-7 w-7 rounded-md bg-primary" />
              <span className="text-lg font-bold tracking-tight">AnimePlay</span>
            </>
          )}
        </Link>

        {/* Marquee */}
        <div className="relative flex-grow overflow-hidden hidden sm:block">
          {marquee && (
            <div className="flex whitespace-nowrap will-change-transform animate-marquee">
              <span className="px-4 text-xs text-muted-foreground">{marquee}</span>
              <span className="px-4 text-xs text-muted-foreground" aria-hidden>{marquee}</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
        </div>

        {/* Search */}
        <form
          onSubmit={submit}
          className="flex w-44 sm:w-64 shrink-0 items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 focus-within:ring-primary/50"
        >
          <button type="submit" aria-label="Search" className="text-muted-foreground hover:text-foreground">
            <Search className="h-4 w-4" />
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search anime…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>
      </div>
    </header>
  );
}
