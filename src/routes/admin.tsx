import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { Film, LogOut, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — AnimePlay" }] }),
});

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
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 md:pt-10 md:pb-12">
      {/* Header — desktop only */}
      <header className="mb-6 hidden md:flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card ring-1 ring-white/10 hover:ring-primary/40"
            aria-label="Back to site"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-white/10 hover:ring-destructive/50 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </header>

      {/* Mobile compact header */}
      <header className="md:hidden mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card ring-1 ring-white/10"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-base font-semibold">Admin</h1>
        <span className="h-9 w-9" />
      </header>

      <Outlet />

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 glass border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-md grid-cols-2">
          <Link
            to="/admin/animes"
            className="flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground"
            activeProps={{ className: "flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-primary" }}
          >
            <Film className="h-5 w-5" />
            Animes
          </Link>
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
