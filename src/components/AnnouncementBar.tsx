import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { subscribeAnnouncement } from "../lib/settings";
import type { Announcement } from "../lib/types";

export function AnnouncementBar() {
  const [a, setA] = useState<Announcement | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => subscribeAnnouncement(setA), []);
  useEffect(() => {
    const key = `ann_closed_${a?.text ?? ""}`;
    if (typeof window !== "undefined" && a?.text && sessionStorage.getItem(key)) {
      setClosed(true);
    }
  }, [a?.text]);

  if (!a || !a.enabled || !a.text || closed) return null;

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(`ann_closed_${a.text}`, "1");
    } catch {}
  };

  const Inner = (
    <span className="truncate text-xs font-medium">{a.text}</span>
  );

  const safeHref = a.href && /^https?:\/\//i.test(a.href) ? a.href : undefined;

  return (
    <div className="sticky top-0 z-40 w-full border-b border-white/10 bg-gradient-to-r from-primary/30 via-primary/15 to-primary/30 backdrop-blur supports-[backdrop-filter]:bg-primary/15">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-1.5">
        <span className="hidden sm:inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        {safeHref ? (
          <a href={safeHref} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate hover:underline">
            {Inner}
          </a>
        ) : (
          <div className="min-w-0 flex-1">{Inner}</div>
        )}
        <button
          onClick={close}
          aria-label="Dismiss announcement"
          className="rounded-md p-1 text-foreground/70 hover:bg-white/10 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
