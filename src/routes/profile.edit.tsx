import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Save, User as UserIcon } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { ref, update } from "firebase/database";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { auth, db } from "../lib/firebase";
import { getPublicBio, setPublicBio } from "../lib/settings";

export const Route = createFileRoute("/profile/edit")({
  component: ProfileEditPage,
  head: () => ({ meta: [{ title: "Edit Profile — AnimePlay" }] }),
});

const MAX_NAME = 32;
const MAX_BIO = 160;

function ProfileEditPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
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
    setAvatar(user.photoURL ?? "");
    getPublicBio(user.uid)
      .then(setBio)
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, [loading, user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;
    const n = name.trim().slice(0, MAX_NAME);
    const b = bio.trim().slice(0, MAX_BIO);
    const a = avatar.trim();
    setBusy(true);
    try {
      await updateProfile(auth.currentUser, { displayName: n, photoURL: a || null });
      await update(ref(db, `users/${user.uid}`), { displayName: n, photoURL: a || null });
      await setPublicBio(user.uid, b);
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
    <main className="mx-auto max-w-md px-4 pt-4 pb-10 animate-fade-in">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/profile" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 hover:ring-primary/40">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Edit Profile</h1>
          <p className="text-xs text-muted-foreground">Update how you appear across AnimePlay.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />

        <div className="relative mb-4 flex justify-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-white/15 bg-white/5 flex items-center justify-center text-2xl font-bold text-primary">
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar preview"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <UserIcon className="h-9 w-9" />
            )}
          </div>
        </div>

        <label className="relative block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={MAX_NAME} placeholder="e.g. Senku-kun" className="input mt-1.5" />
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Synced to Firebase Auth</span>
            <span>{name.length}/{MAX_NAME}</span>
          </div>
        </label>

        <label className="relative mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avatar URL (Optional)</span>
          <input value={avatar} onChange={(e) => setAvatar(e.target.value)} type="url" placeholder="https://example.com/me.jpg" className="input mt-1.5" />
          <div className="mt-1 text-[11px] text-muted-foreground">Paste an image link (JPG, PNG, GIF)</div>
        </label>

        <label className="relative mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={MAX_BIO} placeholder="Tell other otaku about yourself…" className="input mt-1.5 resize-none" />
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Public — visible to others</span>
            <span>{bio.length}/{MAX_BIO}</span>
          </div>
        </label>

        <div className="mt-4 rounded-xl bg-white/5 p-3 text-[11px] text-muted-foreground ring-1 ring-white/10">
          <span className="font-semibold text-foreground">Email</span> — {user.email}
        </div>

        <button type="submit" disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          <Save className="h-4 w-4" />
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </main>
  );
}
