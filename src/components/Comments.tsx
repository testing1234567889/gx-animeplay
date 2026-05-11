import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ref, get } from "firebase/database";
import { Pin, Reply as ReplyIcon, Trash2 } from "lucide-react";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth-context";
import {
  addComment,
  subscribeComments,
  deleteComment,
  setCommentPinned,
} from "../lib/comments";
import type { Comment, UserProfile } from "../lib/types";
import { RoleBadges, rolesFromProfile } from "./RoleBadges";
import { Skeleton } from "./Skeleton";

export function Comments({ episodeId }: { episodeId: string }) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [roleMap, setRoleMap] = useState<Record<string, UserProfile>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);

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

  // Group: pinned top-level first (newest), then top-level newest. Replies attached.
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
    // sort replies oldest-first inside a thread
    for (const arr of byParent.values()) arr.sort((a, b) => a.created_at - b.created_at);
    tops.sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return b.created_at - a.created_at;
    });
    return { roots: tops, repliesOf: byParent };
  }, [items]);

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
      });
      setText("");
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

    return (
      <li key={c.id} className={isReply ? "" : ""}>
        <div className={"flex gap-3 rounded-xl p-3 ring-1 " + (c.pinned ? "bg-primary/10 ring-primary/30" : "bg-card ring-white/5")}>
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-sm font-bold text-primary">
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
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {c.pinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              )}
              <span className="truncate text-sm font-semibold">{name}</span>
              <RoleBadges roles={rolesFromProfile(author)} />
              <span className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{c.text}</p>
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
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => { setReplyTo(null); setText(""); }} className="text-xs text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                  <button type="submit" disabled={busy || !text.trim()} className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {busy ? "Posting…" : "Reply"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {!isReply && replies.length > 0 && (
          <ul className="mt-2 ml-8 space-y-2 border-l-2 border-white/10 pl-3">
            {replies.map((r) => renderItem(r, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold">Comments</h2>
      {user ? (
        replyTo === null && (
          <form onSubmit={(e) => submit(e, null)} className="mb-5 rounded-xl bg-card p-3 ring-1 ring-white/5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Share your thoughts…"
              className="input resize-none"
              maxLength={500}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{text.length}/500</span>
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Posting…" : "Post"}
              </button>
            </div>
          </form>
        )
      ) : (
        <Link
          to="/login"
          className="mb-5 block rounded-xl bg-card p-3 text-center text-sm text-muted-foreground ring-1 ring-white/5 hover:text-foreground"
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
    </section>
  );
}
