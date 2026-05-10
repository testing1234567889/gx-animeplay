import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { Film, ListVideo, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — AnimePlay" }] }),
});

const tabs = [
  { to: "/admin/animes" as const, label: "Animes", icon: Film },
  { to: "/admin/episodes" as const, label: "Episodes", icon: ListVideo },
];

function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:pb-12">
      {/* Desktop tabs */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <nav className="flex items-center gap-1 glass rounded-xl p-1">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "rounded-lg px-3 py-1.5 text-sm bg-primary text-primary-foreground" }}
            >
              {t.label}
            </Link>
          ))}
          <button
            onClick={() => logout()}
            className="ml-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Logout
          </button>
        </nav>
      </div>

      <div className="mt-6">
        <Outlet />
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 glass border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground"
                activeProps={{ className: "flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-primary" }}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </Link>
            );
          })}
          <button
            onClick={() => logout()}
            className="flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}
