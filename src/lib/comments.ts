import { ref, push, set, onValue, remove, update } from "firebase/database";
import { db } from "./firebase";
import type { Comment } from "./types";

export function subscribeComments(episodeId: string, cb: (c: Comment[]) => void) {
  return onValue(ref(db, `comments/${episodeId}`), (snap) => {
    const v = snap.val() as Record<string, any> | null;
    const list = v
      ? Object.entries(v).map(([id, val]) => ({ id, ...(val as object) } as Comment))
      : [];
    list.sort((a, b) => b.created_at - a.created_at);
    cb(list);
  });
}

export async function addComment(
  episodeId: string,
  c: Omit<Comment, "id" | "created_at" | "pinned">,
) {
  const r = push(ref(db, `comments/${episodeId}`));
  await set(r, { ...c, parent_id: c.parent_id ?? null, created_at: Date.now() });
}

export async function deleteComment(episodeId: string, id: string) {
  await remove(ref(db, `comments/${episodeId}/${id}`));
}

export async function setCommentPinned(episodeId: string, id: string, pinned: boolean) {
  await update(ref(db, `comments/${episodeId}/${id}`), { pinned });
}
