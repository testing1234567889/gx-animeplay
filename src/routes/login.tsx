import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth-context";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Login — AnimePlay Admin" }] }),
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate({ to: "/admin" });
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl glass p-6"
      >
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your library.</p>

        <label className="mt-5 block text-xs font-medium text-muted-foreground">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg bg-input/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg bg-input/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">
          ← Back home
        </Link>
      </motion.form>
    </main>
  );
}
