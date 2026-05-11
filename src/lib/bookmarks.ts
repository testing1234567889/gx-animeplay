import { ref, set, remove, onValue, get } from "firebase/database";
import { db } from "./firebase";

export async function addBookmark(uid: string, animeId: string) {
  await set(ref(db, `users/${uid}/bookmarks/${animeId}`), true);
}

export async function removeBookmark(uid: string, animeId: string) {
  await remove(ref(db, `users/${uid}/bookmarks/${animeId}`));
}

export function subscribeBookmarks(uid: string, cb: (ids: string[]) => void) {
  return onValue(ref(db, `users/${uid}/bookmarks`), (snap) => {
    const v = snap.val() as Record<string, boolean> | null;
    cb(v ? Object.keys(v).filter((k) => v[k]) : []);
  });
}

export async function isBookmarkedOnce(uid: string, animeId: string) {
  const snap = await get(ref(db, `users/${uid}/bookmarks/${animeId}`));
  return !!snap.val();
}
