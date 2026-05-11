import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { subscribeSiteLogo } from "../lib/settings";

export function TopNav() {
  const [logo, setLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    return subscribeSiteLogo((url) => {
      setLogo(url);
      setLogoLoading(false);
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
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 md:gap-4 w-full px-4">
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

        {/* Search */}
        <form
          onSubmit={submit}
          className="flex min-w-0 flex-1 sm:flex-none sm:w-64 items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 focus-within:ring-primary/50"
        >
          <button type="submit" aria-label="Search" className="text-muted-foreground hover:text-foreground shrink-0">
            <Search className="h-4 w-4" />
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search anime…"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>
      </div>
    </header>
  );
}
