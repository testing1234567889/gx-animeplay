import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { Film, LogOut, ArrowLeft, CreditCard, Users, Settings, ShieldCheck, Flag } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — AnimePlay" }] }),
});

const tabs = [
  { to: "/admin/animes", label: "Animes", icon: Film },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminGate() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      toast.success("Signed in");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") toast.error(err?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl glass p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">Admin sign in</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Email/password login is reserved for staff. Access is verified against the admin
          allowlist in the database.
        </p>

        <label className="mt-5 block text-xs font-medium text-muted-foreground">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Password</label>
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1" />

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Please wait…" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          className="mt-2 w-full rounded-lg bg-white/5 py-2.5 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-60"
        >
          Sign in with Google
        </button>
        <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
      </form>
    </main>
  );
}

function AdminLayout() {
  const { user, loading, adminChecked, isAdmin, logout } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </main>
    );
  }

  if (!user) return <AdminGate />;

  if (!adminChecked) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted-foreground">Verifying admin privileges…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center px-6">
        <ShieldCheck className="h-8 w-8 text-destructive" />
        <h1 className="text-xl font-bold">Admin access required</h1>
        <p className="text-sm text-muted-foreground">
          This account ({user.email ?? user.uid}) is not on the admin allowlist.
        </p>
        <div className="flex gap-2">
          <button onClick={() => logout()} className="rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-white/10">
            Sign out
          </button>
          <Link to="/" className="rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-white/10">
            Go home
          </Link>
        </div>
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
        <div className="mx-auto grid max-w-md grid-cols-5">
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
