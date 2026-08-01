import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { toast } from "sonner";
import { ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Masuk dengan Google — Gx-AnimePlay" },
      {
        name: "description",
        content:
          "Masuk atau daftar sekali klik dengan akun Google untuk komentar, bookmark, dan akses VIP di Gx-AnimePlay.",
      },
      { property: "og:title", content: "Masuk dengan Google — Gx-AnimePlay" },
      {
        property: "og:description",
        content: "Satu klik dengan Google — tanpa password, tanpa email verifikasi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.1C12.3 13.3 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-2.8-.4-4.1H24v8.4h12.5c-.3 2.1-1.6 5.2-4.6 7.3l7.7 6c4.5-4.2 6.5-10.2 6.5-17.6z" />
      <path fill="#FBBC05" d="M10.4 28.7A14.7 14.7 0 0 1 9.6 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.6-5.8l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.4 0-11.7-3.8-13.6-9.8l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function LoginPage() {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/profile" });
  }, [user, navigate]);

  const onGoogle = async () => {
    setBusy(true);
    try {
      await loginWithGoogle();
      toast.success("Berhasil masuk");
      navigate({ to: "/profile" });
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        toast.info("Login dibatalkan");
      } else {
        toast.error(err?.message ?? "Gagal masuk");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl glass p-6">
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/40">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-center text-xl font-bold tracking-tight">Masuk / Daftar</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Cukup satu klik dengan Google. Akun baru otomatis dibuat.
          </p>

          <button
            onClick={onGoogle}
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3 text-sm font-bold text-slate-900 transition hover:bg-white/90 disabled:opacity-60"
          >
            <GoogleMark />
            {busy ? "Menghubungkan…" : "Lanjutkan dengan Google"}
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            Login email &amp; password sudah dihapus untuk pengguna. Hanya panel admin yang
            memakainya.
          </p>

          <Link
            to="/admin"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-xs font-semibold text-muted-foreground ring-1 ring-white/10 hover:text-foreground"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Masuk sebagai Admin
          </Link>

          <Link to="/" className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground">
            Lanjut jelajah sebagai guest
          </Link>
        </div>
      </div>
    </main>
  );
}
