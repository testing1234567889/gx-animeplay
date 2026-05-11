import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { subscribeSiteLogo } from "../lib/settings";

export function TopNav() {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => subscribeSiteLogo(setLogo), []);

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          {logo ? (
            <img
              src={logo}
              alt="AnimePlay"
              referrerPolicy="no-referrer"
              draggable={false}
              className="h-7 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <>
              <div className="h-7 w-7 rounded-md bg-primary" />
              <span className="text-lg font-bold tracking-tight">AnimePlay</span>
            </>
          )}
        </Link>
        <div className="flex max-w-sm flex-1 items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search anime…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </header>
  );
}
