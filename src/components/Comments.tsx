import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ref, get } from "firebase/database";
import { Pin, Reply as ReplyIcon, Trash2, Flag, EyeOff, Send, ArrowUp } from "lucide-react";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth-context";
import {
  addComment,
  subscribeComments,
  deleteComment,
  setCommentPinned,
} from "../lib/comments";
import { reportComment } from "../lib/progress";
import type { Comment, UserProfile } from "../lib/types";
import { RoleBadges, rolesFromProfile } from "./RoleBadges";
import { Skeleton } from "./Skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "./ui/dialog";

type Props = {
  episodeId: string;
  onSeek?: (seconds: number) => void;
};

const REASONS = ["Spam", "Pornography", "Promotion", "Other"] as const;
type Reason = (typeof REASONS)[number];

// Hours-aware mm:ss / hh:mm:ss timestamp parser
const TS_RE = /\b(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d)\b/g;
function parseTs(text: string): number | null {
  const m = /^(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d)$/.exec(text);
  if (!m) return null;
  const h = m[1] ? Number(m[1]) : 0;
  const mm = Number(m[2]);
  const ss = Number(m[3]);
  return h * 3600 + mm * 60 + ss;
}

function nameColorFor(p?: UserProfile | null): string {
  if (!p) return "text-foreground";
  if (p.isAdmin) return "text-red-500";
  if (p.isModerator) return "text-green-500";
  if (p.status === "vip") return "text-yellow-500";
  if (p.isBeta) return "text-purple-400";
  return "text-foreground";
}

function CommentText({
  text,
  onSeek,
}: { text: string; onSeek?: (s: number) => void }) {
  const parts = useMemo(() => {
    const out: Array<{ t: "text" | "ts"; v: string; sec?: number }> = [];
    let last = 0;
    const re = new RegExp(TS_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ t: "text", v: text.slice(last, m.index) });
      const sec = parseTs(m[0]);
      if (sec != null) out.push({ t: "ts", v: m[0], sec });
      else out.push({ t: "text", v: m[0] });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ t: "text", v: text.slice(last) });
    return out;
  }, [text]);

  return (
    <>
      {parts.map((p, i) =>
        p.t === "ts" ? (
          <span
            key={i}
            onClick={() => onSeek?.(p.sec!)}
            className="text-blue-500 hover:underline cursor-pointer font-medium"
          >
            {p.v}
          </span>
        ) : (
          <span key={i}>{p.v}</span>
        ),
      )}
    </>
  );
}

export function Comments({ episodeId, onSeek }: Props) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [busy, setBusy] = useState(false);
  const [roleMap, setRoleMap] = useState<Record<string, UserProfile>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<Comment | null>(null);
  const [sortMode, setSortMode] = useState<"top" | "new">("new");
  const [showFab, setShowFab] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const isAdmin = !!profile?.isAdmin;

  useEffect(() => subscribeComments(episodeId, setItems), [episodeId]);

  useEffect(() => {
    if (!items) return;
    const unknown = Array.from(new Set(items.map((c) => c.uid))).filter((u) => !(u in roleMap));
    if (unknown.length === 0) return;
    let cancelled = false;
    Promise.all(
      unknown.map(async (uid) => {
        try {
          const s = await get(ref(db, `users/${uid}`));
          return [uid, { uid, ...(s.val() as object) } as UserProfile] as const;
        } catch {
          return [uid, { uid } as UserProfile] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setRoleMap((m) => ({ ...m, ...Object.fromEntries(entries) }));
    });
    return () => { cancelled = true; };
  }, [items, roleMap]);

  const { roots, repliesOf } = useMemo(() => {
    const list = items ?? [];
    const byParent = new Map<string, Comment[]>();
    const tops: Comment[] = [];
    for (const c of list) {
      if (c.parent_id) {
        const arr = byParent.get(c.parent_id) ?? [];
        arr.push(c);
        byParent.set(c.parent_id, arr);
      } else {
        tops.push(c);
      }
    }
    for (const arr of byParent.values()) arr.sort((a, b) => a.created_at - b.created_at);
    tops.sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      if (sortMode === "top") {
        const ar = (byParent.get(a.id)?.length ?? 0);
        const br = (byParent.get(b.id)?.length ?? 0);
        if (br !== ar) return br - ar;
      }
      return b.created_at - a.created_at;
    });
    return { roots: tops, repliesOf: byParent };
  }, [items, sortMode]);

  // FAB scroll detection — show when user has scrolled past comments top
  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setShowFab(top < -200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalCount = items?.length ?? 0;

  const submit = async (e: FormEvent, parentId: string | null) => {
    e.preventDefault();
    if (!user) return toast.error("Sign in to comment");
    const t = text.trim();
    if (!t) return;
    if (t.length > 500) return toast.error("Max 500 characters");
    setBusy(true);
    try {
      await addComment(episodeId, {
        uid: user.uid,
        email: user.email ?? "",
        text: t,
        parent_id: parentId,
        isSpoiler,
      } as any);
      setText("");
      setIsSpoiler(false);
      setReplyTo(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  const onPin = async (c: Comment) => {
    try { await setCommentPinned(episodeId, c.id, !c.pinned); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };
  const onDelete = async (c: Comment) => {
    try { await deleteComment(episodeId, c.id); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const renderItem = (c: Comment, isReply = false) => {
    const author = roleMap[c.uid];
    const name = author?.displayName?.trim() || c.email?.split("@")[0] || "user";
    const initial = (name[0] ?? "?").toUpperCase();
    const rawPhoto = author?.photoURL || "";
    const photoURL = /^https:\/\//i.test(rawPhoto) ? rawPhoto : "";
    const canDelete = !!user && (user.uid === c.uid || isAdmin);
    const replies = repliesOf.get(c.id) ?? [];
    const reportedByMe = !!user && !!c.reports && !!c.reports[user.uid];

    return (
      <li key={c.id}>
        <div className={"relative flex gap-3 rounded-xl p-3 pr-10 ring-1 " + (c.pinned ? "bg-primary/10 ring-primary/30" : "bg-card ring-white/5")}>
          {/* Flag (top-right). Hidden if user already reported. Available for every comment incl. own/admin/mod */}
          {user && !reportedByMe && (
            <button
              onClick={() => setReportFor(c)}
              aria-label="Report comment"
              title="Report"
              className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-amber-500/15 hover:text-amber-400 transition"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          )}
          {user && reportedByMe && (
            <span
              aria-label="Already reported"
              title="You already reported this"
              className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-amber-400/60"
            >
              <Flag className="h-3.5 w-3.5 fill-current" />
            </span>
          )}
          <Link
            to="/user/$userId"
            params={{ userId: c.uid }}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-sm font-bold text-primary hover:ring-2 hover:ring-primary/60 transition"
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt={name}
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span>{initial}</span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {c.pinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              )}
              <Link
                to="/user/$userId"
                params={{ userId: c.uid }}
                className={"truncate text-sm font-bold hover:underline " + nameColorFor(author)}
              >
                {name}
              </Link>
              <RoleBadges roles={rolesFromProfile(author)} />
              <span className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
            </div>
            {c.isSpoiler ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90 blur-md cursor-pointer transition-all hover:blur-none active:blur-none select-none">
                <CommentText text={c.text} onSeek={onSeek} />
              </p>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                <CommentText text={c.text} onSeek={onSeek} />
              </p>
            )}
            {c.isSpoiler && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <EyeOff className="h-3 w-3" /> Spoiler — tap to reveal
              </span>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs">
              {!isReply && user && (
                <button
                  onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setText(""); }}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <ReplyIcon className="h-3.5 w-3.5" /> Reply
                </button>
              )}
              {!isReply && isAdmin && (
                <button
                  onClick={() => onPin(c)}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <Pin className="h-3.5 w-3.5" /> {c.pinned ? "Unpin" : "Pin"}
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(c)}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}
            </div>

            {!isReply && replyTo === c.id && user && (
              <form onSubmit={(e) => submit(e, c.id)} className="mt-3 rounded-lg bg-background/60 p-2 ring-1 ring-white/5">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  placeholder={`Reply to ${name}…`}
                  className="input resize-none"
                  maxLength={500}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={isSpoiler}
                      onChange={(e) => setIsSpoiler(e.target.checked)}
                    />
                    Mark as spoiler
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setReplyTo(null); setText(""); }} className="text-xs text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                    <button type="submit" disabled={busy || !text.trim()} className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                      {busy ? "Posting…" : "Reply"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {!isReply && replies.length > 0 && (
          <ul className="mt-2 ml-4 md:ml-8 space-y-2 border-l-2 border-white/10 pl-3">
            {replies.map((r) => renderItem(r, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <section ref={sectionRef} className="relative mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Comments <span className="text-muted-foreground font-normal">({totalCount})</span>
        </h2>
        <div className="inline-flex rounded-full bg-card p-1 ring-1 ring-white/10">
          <button
            onClick={() => setSortMode("top")}
            className={
              "rounded-full px-3 py-1 text-xs font-semibold transition " +
              (sortMode === "top" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
            }
          >
            Top Comment
          </button>
          <button
            onClick={() => setSortMode("new")}
            className={
              "rounded-full px-3 py-1 text-xs font-semibold transition " +
              (sortMode === "new" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
            }
          >
            Terbaru
          </button>
        </div>
      </div>

      {user ? (
        replyTo === null && (
          <form onSubmit={(e) => submit(e, null)} className="mb-5 rounded-2xl bg-card p-3 ring-1 ring-white/10 focus-within:ring-primary/40 transition">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Share your thoughts…"
              className="input resize-none rounded-xl"
              maxLength={500}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isSpoiler}
                  onChange={(e) => setIsSpoiler(e.target.checked)}
                />
                Mark as spoiler
              </label>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground">{text.length}/500</span>
                <button
                  type="submit"
                  disabled={busy || !text.trim()}
                  aria-label="Post comment"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-60 transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        )
      ) : (
        <Link
          to="/login"
          className="mb-5 block rounded-2xl bg-card p-3 text-center text-sm text-muted-foreground ring-1 ring-white/5 hover:text-foreground"
        >
          Sign in to join the discussion →
        </Link>
      )}

      {items === null ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : roots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
          Be the first to comment.
        </div>
      ) : (
        <ul className="space-y-3">{roots.map((c) => renderItem(c))}</ul>
      )}

      {showFab && (
        <button
          onClick={() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          aria-label="Scroll to top of comments"
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 hover:scale-110 transition"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      <ReportDialog
        comment={reportFor}
        onClose={() => setReportFor(null)}
        episodeId={episodeId}
        reporterUid={user?.uid ?? ""}
      />
    </section>
  );
}

function ReportDialog({
  comment,
  onClose,
  episodeId,
  reporterUid,
}: {
  comment: Comment | null;
  onClose: () => void;
  episodeId: string;
  reporterUid: string;
}) {
  const [reason, setReason] = useState<Reason>("Spam");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (comment) { setReason("Spam"); setCustom(""); }
  }, [comment]);

  const submit = async () => {
    if (!comment || !reporterUid) return;
    if (reason === "Other" && !custom.trim()) {
      return toast.error("Please describe the issue");
    }
    setBusy(true);
    try {
      await reportComment({
        episodeId,
        commentId: comment.id,
        reporterUid,
        reason,
        customText: reason === "Other" ? custom.trim() : undefined,
        textSnippet: comment.text,
        commentUid: comment.uid,
      });
      toast.success("Reported. Moderators will review.");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!comment} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report comment</DialogTitle>
          <DialogDescription>
            Help keep AnimePlay safe. Select a reason for flagging this comment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={
                "rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition " +
                (reason === r
                  ? "bg-primary/20 text-primary ring-primary/50"
                  : "bg-card text-foreground/80 ring-white/10 hover:ring-primary/30")
              }
            >
              {r === "Other" ? "Custom" : r}
            </button>
          ))}
        </div>
        {reason === "Other" && (
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Describe the issue (max 200 chars)"
            className="input resize-none"
          />
        )}
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-card px-4 py-2 text-sm ring-1 ring-white/10 hover:ring-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit report"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
