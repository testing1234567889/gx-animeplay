import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { addComment, subscribeComments } from "../lib/comments";
import type { Comment } from "../lib/types";
import { VipBadge } from "./VipBadge";
import { Skeleton } from "./Skeleton";

export function Comments({ episodeId }: { episodeId: string }) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeComments(episodeId, setItems), [episodeId]);

  const onSubmit = async (e: FormEvent) => {
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
      });
      setText("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold">Comments</h2>
      {user ? (
        <form onSubmit={onSubmit} className="mb-5 rounded-xl bg-card p-3 ring-1 ring-white/5">
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
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
          Be the first to comment.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => {
            const name = c.email?.split("@")[0] || "user";
            const initial = name[0]?.toUpperCase() ?? "?";
            return (
              <li key={c.id} className="flex gap-3 rounded-xl bg-card p-3 ring-1 ring-white/5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold">{name}</span>
                    <VipBadge vip={c.status === "vip"} />
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{c.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
