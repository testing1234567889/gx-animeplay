import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Bookmark, Crown, History, HelpCircle, LogOut, Shield, ChevronRight, User as UserIcon, Pencil, X, Save } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { auth } from "../lib/firebase";
import { subscribeHistory, type HistoryItem } from "../lib/history";
import { getPublicBio, setPublicBio } from "../lib/settings";
import { RoleBadges, rolesFromProfile } from "../components/RoleBadges";

const ADMIN_EMAIL = "husain2hasan4@gmail.com";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — AnimePlay" }] }),
});

const TELEGRAM_HELP_URL = "https://t.me/animeplay_help";

function ProfilePage() {
  const { user, profile, logout, loading } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bio, setBio] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeHistory(user.uid, setHistory);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getPublicBio(user.uid).then(setBio).catch(() => {});
  }, [user]);

  if (loading) {
    return <main className="px-4 pt-10 text-center text-sm text-muted-foreground">Loading…</main>;
  }

  if (!user) return <GuestState />;

  const vip = profile?.status === "vip";
  const pending = profile?.payment_status === "pending";
  const resume = history[0];
  const displayName = (user.displayName || "").trim() || "Anonym User";
  const initial = (displayName[0] ?? user.email?.[0] ?? "U").toUpperCase();

  return (
    <main className="mx-auto max-w-md px-4 pt-6 animate-fade-in">
      {/* Header — glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div
            className={"relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-bold ring-2 " + (vip ? "ring-yellow-400/60" : "ring-white/15")}
            style={vip ? { background: "linear-gradient(135deg,#FDE68A,#F59E0B)", color: "#111" } : { background: "color-mix(in oklab,var(--primary) 25%, transparent)", color: "var(--primary)" }}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : null}
            <span className="relative">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-semibold">{displayName}</span>
            </div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            <RoleBadges
              roles={{ ...rolesFromProfile(profile), isAdmin: !!profile?.isAdmin || user.email === ADMIN_EMAIL }}
              className="mt-1.5"
            />
            {bio && <p className="mt-1.5 line-clamp-2 text-xs text-foreground/70">{bio}</p>}
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Edit profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {pending && (
          <div className="mt-4 rounded-xl bg-yellow-500/10 p-3 text-xs ring-1 ring-yellow-400/30">
            <div className="font-semibold text-yellow-300">Waiting for verification</div>
            <p className="mt-0.5 text-muted-foreground">Your VIP payment is being reviewed.</p>
          </div>
        )}

        {!vip && !pending && (
          <Link
            to="/upgrade"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-black"
            style={{ background: "linear-gradient(135deg,#FDE68A,#F59E0B,#B45309)" }}
          >
            <Crown className="h-4 w-4" /> Upgrade to VIP
          </Link>
        )}
      </div>

      {/* Resume watching */}
      {resume && (
        <Link
          to="/watch/$animeId/$episodeId"
          params={{ animeId: resume.anime_id, episodeId: resume.episode_id }}
          className="mt-4 flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-white/5 hover:ring-primary/40 transition"
        >
          <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-black/40">
            {resume.poster_url && <img src={resume.poster_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Resume Watching</div>
            <div className="truncate text-sm font-semibold">{resume.anime_title}</div>
            <div className="text-xs text-muted-foreground">Episode {resume.episode_number}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      {/* Grouped list */}
      <Section title="Library">
        <Row to="/bookmark" icon={Bookmark} label="My Bookmarks" />
        <Row to="/profile" icon={History} label={`Watch History (${history.length})`} static />
      </Section>

      <Section title="Account">
        <Row to="/upgrade" icon={Crown} label={vip ? "Manage Subscription" : "Subscription"} accent={vip} />
        {(profile?.isAdmin || user.email === ADMIN_EMAIL) && (
          <Row to="/admin" icon={Shield} label="Admin Dashboard" />
        )}
      </Section>

      <Section title="Support">
        <a
          href={TELEGRAM_HELP_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-white/5 hover:ring-primary/40"
        >
          <HelpCircle className="h-5 w-5 text-primary" />
          <div className="flex-1 text-sm font-medium">Help Center (Telegram)</div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </a>
      </Section>

      <button
        onClick={() => logout()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-card p-3 text-sm font-semibold text-destructive ring-1 ring-white/5 hover:ring-destructive/50"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>

      {history.length > 1 && (
        <Section title="Recent">
          {history.slice(0, 5).map((h) => (
            <Link
              key={h.anime_id}
              to="/watch/$animeId/$episodeId"
              params={{ animeId: h.anime_id, episodeId: h.episode_id }}
              className="flex items-center gap-3 rounded-xl bg-card p-2.5 ring-1 ring-white/5"
            >
              <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-black/40">
                {h.poster_url && <img src={h.poster_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{h.anime_title}</div>
                <div className="text-xs text-muted-foreground">Ep {h.episode_number}</div>
              </div>
            </Link>
          ))}
        </Section>
      )}

      {editOpen && (
        <EditProfileModal
          uid={user.uid}
          initialName={user.displayName ?? ""}
          initialBio={bio}
          initialAvatar={user.photoURL ?? ""}
          onClose={() => setEditOpen(false)}
          onSaved={(_n, b) => setBio(b)}
        />
      )}
    </main>
  );
}

function EditProfileModal({
  uid, initialName, initialBio, initialAvatar, onClose, onSaved,
}: {
  uid: string;
  initialName: string;
  initialBio: string;
  initialAvatar: string;
  onClose: () => void;
  onSaved: (name: string, bio: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [bio, setBioVal] = useState(initialBio);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPublicBio(uid).then((b) => setBioVal(b)).catch(() => {});
  }, [uid]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const n = name.trim().slice(0, 32);
    const b = bio.trim().slice(0, 160);
    const a = avatar.trim();
    setBusy(true);
    try {
      await updateProfile(auth.currentUser, { displayName: n, photoURL: a || null });
      await setPublicBio(uid, b);
      onSaved(n, b);
      toast.success("Profile updated");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="relative w-full max-w-sm p-6 bg-slate-900 rounded-xl shadow-2xl m-4 border border-slate-800 max-h-[90vh] overflow-y-auto"
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Edit Profile</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-4 flex justify-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-white/15 bg-white/5 flex items-center justify-center text-2xl font-bold text-primary">
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar preview"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <UserIcon className="h-8 w-8" />
            )}
          </div>
        </div>

        <label className="relative block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            placeholder="e.g. Senku-kun"
            className="input mt-1.5"
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Synced to Firebase Auth</span>
            <span>{name.length}/32</span>
          </div>
        </label>

        <label className="relative mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avatar URL (Optional)</span>
          <input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            type="url"
            placeholder="https://example.com/me.jpg"
            className="input mt-1.5"
          />
          <div className="mt-1 text-[11px] text-muted-foreground">Paste an image link (JPG, PNG, GIF)</div>
        </label>

        <label className="relative mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBioVal(e.target.value)}
            rows={3}
            maxLength={160}
            placeholder="Tell other otaku about yourself…"
            className="input mt-1.5 resize-none"
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Public — visible to others</span>
            <span>{bio.length}/160</span>
          </div>
        </label>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-semibold ring-1 ring-white/10">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  to, icon: Icon, label, accent, static: isStatic,
}: { to: string; icon: any; label: string; accent?: boolean; static?: boolean }) {
  const cls = "flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-white/5 hover:ring-primary/40";
  const inner = (
    <>
      <Icon className={"h-5 w-5 " + (accent ? "text-yellow-300" : "text-primary")} />
      <div className="flex-1 text-sm font-medium">{label}</div>
      {!isStatic && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </>
  );
  if (isStatic) return <div className={cls}>{inner}</div>;
  return <Link to={to} className={cls}>{inner}</Link>;
}

function GuestState() {
  return (
    <main className="mx-auto max-w-md px-4 pt-10 pb-12 animate-fade-in">
      <div className="rounded-3xl bg-card p-6 text-center ring-1 ring-white/5">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-primary/10 ring-1 ring-primary/30">
          <UserIcon className="h-9 w-9 text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Join the Community</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to bookmark anime, comment with a VIP badge, and resume where you left off.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          Sign in / Create account
        </Link>
        <Link to="/" className="mt-3 block text-xs text-muted-foreground hover:text-foreground">
          Continue as guest →
        </Link>
      </div>
    </main>
  );
}
