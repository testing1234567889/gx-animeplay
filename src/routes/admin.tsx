import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { Film, LogOut, ArrowLeft, CreditCard, Users, Settings, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — AnimePlay" }] }),
});

const ADMIN_EMAIL = "husain2hasan4@gmail.com";

const tabs = [
  { to: "/admin/animes", label: "Animes", icon: Film },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { user, profile, loading, logout } = useAuth();
  const navigate = useNavigate();
  // Wait for profile to settle. We only redirect if profile data is loaded
  // AND the user is explicitly NOT admin (and not the hardcoded super-admin).
  const [graceUp, setGraceUp] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGraceUp(true), 800);
    return () => clearTimeout(t);
  }, []);

  const isSuper = !!user && user.email === ADMIN_EMAIL;
  const profileReady = !!profile;
  const isAdmin = isSuper || !!profile?.isAdmin;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    // Only kick out if we have profile data AND it says not admin AND not super-admin.
    if (graceUp && profileReady && !isAdmin) {
      navigate({ to: "/" });
    }
  }, [loading, user, profileReady, isAdmin, graceUp, navigate]);

  if (loading || !user || (!profileReady && !isSuper)) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center px-6">
        <ShieldCheck className="h-8 w-8 text-destructive" />
        <h1 className="text-xl font-bold">Admin access required</h1>
        <p className="text-sm text-muted-foreground">Your account does not have admin privileges.</p>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 md:pt-10 md:pb-12">
      <header className="mb-6 hidden md:flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card ring-1 ring-white/10 hover:ring-primary/40">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Signed in as {user.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-white/10 hover:ring-destructive/50 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </header>

      {/* Desktop tabs */}
      <nav className="mb-6 hidden md:flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground"
            activeProps={{ className: "rounded-lg px-3 py-2 text-sm font-semibold bg-primary/15 text-primary ring-1 ring-primary/30" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <header className="md:hidden mb-4 flex items-center justify-between">
        <Link to="/" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card ring-1 ring-white/10">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-base font-semibold">Admin</h1>
        <button onClick={() => logout()} className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card ring-1 ring-white/10">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <Outlet />

      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 glass border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground"
              activeProps={{ className: "flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-primary" }}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
