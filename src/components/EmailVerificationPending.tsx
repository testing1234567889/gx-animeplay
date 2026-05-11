import { useEffect, useState } from "react";
import { sendEmailVerification, signOut } from "firebase/auth";
import { MailCheck, RefreshCw, Send, LogOut } from "lucide-react";
import { toast } from "sonner";
import { auth } from "../lib/firebase";

const COOLDOWN_SEC = 60;

export function EmailVerificationPending() {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const onRefresh = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        toast.success("Email verified! Welcome.");
        // Force a state propagation
        window.location.reload();
      } else {
        toast.warning("Still not verified. Check your inbox / spam.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to refresh");
    } finally {
      setChecking(false);
    }
  };

  const onResend = async () => {
    if (!auth.currentUser || cooldown > 0) return;
    setResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email sent");
      setCooldown(COOLDOWN_SEC);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  const email = auth.currentUser?.email ?? "your email";

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 animate-fade-in">
      <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-yellow-500/20 blur-3xl" />

        <div className="relative">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-center text-xl font-bold tracking-tight">Check Your Inbox!</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            We sent a verification link to{" "}
            <span className="font-semibold text-foreground">{email}</span>. Click the link, then come
            back and tap refresh.
          </p>

          <div className="mt-6 space-y-2">
            <button
              onClick={onRefresh}
              disabled={checking}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <RefreshCw className={"h-4 w-4 " + (checking ? "animate-spin" : "")} />
              {checking ? "Checking…" : "I have verified (Refresh)"}
            </button>
            <button
              onClick={onResend}
              disabled={resending || cooldown > 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending…" : "Resend Email"}
            </button>
            <button
              onClick={() => signOut(auth)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
