import { ref, set, onValue, remove } from "firebase/database";
import { db } from "./firebase";

export type HistoryItem = {
  anime_id: string;
  episode_id: string;
  episode_number: number;
  anime_title: string;
  poster_url?: string;
  updated_at: number;
};

export async function recordHistory(uid: string, item: HistoryItem) {
  await set(ref(db, `users/${uid}/history/${item.anime_id}`), item);
}

export function subscribeHistory(uid: string, cb: (list: HistoryItem[]) => void) {
  return onValue(ref(db, `users/${uid}/history`), (snap) => {
    const v = snap.val() as Record<string, HistoryItem> | null;
    const list = v ? Object.values(v) : [];
    list.sort((a, b) => b.updated_at - a.updated_at);
    cb(list);
  });
}

export async function clearHistoryItem(uid: string, animeId: string) {
  await remove(ref(db, `users/${uid}/history/${animeId}`));
}
