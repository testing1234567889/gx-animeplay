import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Copy, Crown, ImagePlus, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { DANA_NUMBER, VIP_PRICE, getLatestPendingForUser, submitPayment } from "../lib/payments";
import type { Payment } from "../lib/types";

export const Route = createFileRoute("/upgrade")({
  component: UpgradePage,
  head: () => ({ meta: [{ title: "Upgrade VIP — AnimePlay" }] }),
});

function UpgradePage() {
  const { user, profile } = useAuth();
  const [proofUrl, setProofUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<Payment | null>(null);

  useEffect(() => {
    if (user) getLatestPendingForUser(user.uid).then(setLatest);
  }, [user]);

  const isVip = profile?.status === "vip";
  const isPending = profile?.payment_status === "pending";

  const onFile = (file: File) => {
    if (file.size > 700_000) {
      toast.error("File too large (max ~700KB). Use a host like Imgur and paste URL.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProofUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Sign in first");
    if (!proofUrl) return toast.error("Attach proof");
    setBusy(true);
    try {
      await submitPayment({ uid: user.uid, email: user.email ?? "", proof_url: proofUrl });
      toast.success("Submitted! Waiting for verification.");
      setProofUrl("");
      const p = await getLatestPendingForUser(user.uid);
      setLatest(p);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 pt-6 pb-12 animate-fade-in">
      <div
        className="relative overflow-hidden rounded-3xl p-6 ring-1 ring-yellow-500/30"
        style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.18),rgba(120,53,15,0.25))" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/20 ring-1 ring-yellow-400/40">
            <Crown className="h-6 w-6 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">VIP Membership</h1>
            <p className="text-xs text-muted-foreground">Early access · Ad-free · Priority servers</p>
          </div>
        </div>
        <div className="mt-5 flex items-end gap-2">
          <span className="text-4xl font-extrabold text-yellow-300">Rp 50.000</span>
          <span className="mb-1 text-xs text-muted-foreground">/ one-time</span>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-foreground/90">
          <li>★ Watch VIP-only episodes immediately</li>
          <li>★ Skip the 30-minute early-access timer</li>
          <li>★ VIP badge on your comments</li>
        </ul>
      </div>

      {isVip ? (
        <div className="mt-6 rounded-2xl bg-card p-5 text-center ring-1 ring-yellow-400/30">
          <div className="text-lg font-bold">You're already VIP 🎉</div>
          <p className="mt-1 text-sm text-muted-foreground">Enjoy full access across AnimePlay.</p>
          <Link to="/" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Back home
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-white/10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Step 1 — Send Rp {VIP_PRICE.toLocaleString("id-ID")} via DANA
            </h2>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-background/60 p-3 ring-1 ring-white/10">
              <div>
                <div className="text-xs text-muted-foreground">DANA Number</div>
                <div className="font-mono text-lg font-bold">{DANA_NUMBER}</div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(DANA_NUMBER);
                  toast.success("Copied");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/25"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          </section>

          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-white/10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Step 2 — Upload Payment Proof
            </h2>

            {!user ? (
              <Link
                to="/login"
                className="mt-3 block rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground"
              >
                Sign in to continue
              </Link>
            ) : isPending ? (
              <div className="mt-3 rounded-xl bg-yellow-500/10 p-4 text-sm ring-1 ring-yellow-400/30">
                <div className="font-semibold text-yellow-300">Waiting for verification</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  We've received your proof{latest ? ` on ${new Date(latest.created_at).toLocaleString()}` : ""}. You'll be upgraded to VIP once approved.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-3 space-y-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Paste image URL</span>
                  <input
                    type="url"
                    value={proofUrl.startsWith("data:") ? "" : proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://i.imgur.com/..."
                    className="input mt-1"
                  />
                </label>
                <div className="text-center text-xs text-muted-foreground">— or —</div>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-background/60 p-3 ring-1 ring-dashed ring-white/15 hover:ring-primary/40">
                  <ImagePlus className="h-5 w-5 text-primary" />
                  <span className="text-sm">{proofUrl.startsWith("data:") ? "Image attached" : "Upload screenshot"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                  />
                </label>
                {proofUrl && (
                  <img src={proofUrl} alt="Proof" referrerPolicy="no-referrer" className="max-h-56 w-full rounded-xl object-contain ring-1 ring-white/10" />
                )}
                <button
                  type="submit"
                  disabled={busy || !proofUrl}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit for verification
                </button>
              </form>
            )}
          </section>
        </>
      )}
    </main>
  );
}
