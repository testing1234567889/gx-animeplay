import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { auth } from "../lib/firebase";
import { getPublicBio, setPublicBio } from "../lib/settings";

export const Route = createFileRoute("/profile/settings")({
  component: ProfileSettings,
  head: () => ({ meta: [{ title: "Edit Profile — AnimePlay" }] }),
});

const MAX_NAME = 32;
const MAX_BIO = 160;

function ProfileSettings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setName(user.displayName ?? "");
    getPublicBio(user.uid)
      .then(setBio)
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, [loading, user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;
    const trimmedName = name.trim().slice(0, MAX_NAME);
    const trimmedBio = bio.trim().slice(0, MAX_BIO);
    setBusy(true);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmedName });
      await setPublicBio(user.uid, trimmedBio);
      toast.success("Profile updated");
      navigate({ to: "/profile" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user || !hydrated) {
    return <main className="px-4 pt-10 text-center text-sm text-muted-foreground">Loading…</main>;
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-4 animate-fade-in">
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/profile"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 hover:ring-primary/40"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Edit Identity</h1>
          <p className="text-xs text-muted-foreground">Update how you appear across AnimePlay.</p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />

        <label className="relative block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Display Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME}
            placeholder="e.g. Senku-kun"
            className="input mt-1.5"
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Synced to Firebase Auth</span>
            <span>{name.length}/{MAX_NAME}</span>
          </div>
        </label>

        <label className="relative mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bio
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={MAX_BIO}
            placeholder="Tell other otaku about yourself…"
            className="input mt-1.5 resize-none"
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Public — visible to others</span>
            <span>{bio.length}/{MAX_BIO}</span>
          </div>
        </label>

        <div className="mt-4 rounded-xl bg-white/5 p-3 text-[11px] text-muted-foreground ring-1 ring-white/10">
          <span className="font-semibold text-foreground">Email</span> — {user.email}
          <p className="mt-0.5">Email cannot be changed here. Contact support if needed.</p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </main>
  );
}
