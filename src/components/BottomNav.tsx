import { Link, useLocation } from "@tanstack/react-router";
import { Home, Bookmark, CalendarDays, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/bookmark", label: "Bookmark", icon: Bookmark },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  // Hide on admin routes — admin has its own bottom tab bar
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 w-full z-50 border-t border-white/10 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map((it) => {
          const exact = "exact" in it && it.exact;
          const active = exact ? pathname === it.to : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <li key={it.to} className="flex">
              <Link
                to={it.to}
                className={
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors " +
                  (active ? "text-primary" : "text-muted-foreground hover:text-foreground")
                }
              >
                <span
                  className={
                    "flex h-9 w-9 items-center justify-center rounded-full transition " +
                    (active ? "bg-primary/15 ring-1 ring-primary/40" : "")
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
