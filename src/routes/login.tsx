import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — AnimePlay" }] }),
});

type Mode = "signin" | "signup" | "forgot";

function LoginPage() {
  const { login, signup, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) navigate({ to: "/profile" });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        await login(email, password);
        toast.success("Welcome back");
        navigate({ to: "/profile" });
      } else if (mode === "signup") {
        await signup(email, password);
        toast.success("Account created");
        navigate({ to: "/profile" });
      } else {
        await resetPassword(email);
        toast.success("Reset email sent");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 animate-fade-in">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl glass p-6">
        <h1 className="text-xl font-bold tracking-tight">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Join the Community" : "Reset password"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to comment, bookmark, and unlock VIP."
            : mode === "signup"
            ? "Create your free account in seconds."
            : "We'll email you a reset link."}
        </p>

        <label className="mt-5 block text-xs font-medium text-muted-foreground">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-1"
        />

        {mode !== "forgot" && (
          <>
            <label className="mt-4 block text-xs font-medium text-muted-foreground">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input mt-1"
            />
          </>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          {mode === "signin" ? (
            <>
              <button type="button" onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-foreground">
                Forgot password?
              </button>
              <button type="button" onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                Create account
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setMode("signin")} className="text-muted-foreground hover:text-foreground">
              ← Back to sign in
            </button>
          )}
        </div>

        <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">
          Continue browsing as guest
        </Link>
      </form>
    </main>
  );
}
