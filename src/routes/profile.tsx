import { createFileRoute, Link } from "@tanstack/react-router";
import { User, LogOut, Shield } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — AnimePlay" }] }),
});

function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto max-w-md px-4 pb-32 pt-10 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-primary/10 ring-1 ring-primary/30">
          <User className="h-9 w-9 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">
          {user ? user.email : "Guest"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user ? "Signed in" : "Browse anime as a guest"}
        </p>
      </div>

      <div className="mt-8 space-y-2">
        {user ? (
          <>
            <Link
              to="/admin"
              className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-white/5 hover:ring-primary/40"
            >
              <Shield className="h-5 w-5 text-primary" />
              <div className="flex-1 text-sm font-medium">Admin Dashboard</div>
              <span className="text-xs text-muted-foreground">→</span>
            </Link>
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-white/5 hover:ring-destructive/50"
            >
              <LogOut className="h-5 w-5 text-destructive" />
              <div className="flex-1 text-left text-sm font-medium">Logout</div>
            </button>
          </>
        ) : (
          <p className="rounded-xl bg-card p-4 text-center text-sm text-muted-foreground ring-1 ring-white/5">
            Admin sign-in is available at <span className="font-mono text-primary">/login</span>.
          </p>
        )}
      </div>
    </main>
  );
}
