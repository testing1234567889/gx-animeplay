import {
  ref,
  push,
  set,
  update,
  remove,
  get,
  query,
  orderByChild,
  equalTo,
  onValue,
} from "firebase/database";
import { db } from "./firebase";
import type { Anime, Episode } from "./types";

const objToList = <T extends { id: string }>(snap: any): T[] => {
  const val = snap.val() as Record<string, any> | null;
  if (!val) return [];
  return Object.entries(val).map(([id, v]) => ({ id, ...(v as object) })) as T[];
};

// ---------- Animes ----------
export function subscribeAnimes(cb: (a: Anime[]) => void) {
  const r = ref(db, "animes");
  return onValue(r, (snap) => cb(objToList<Anime>(snap)));
}

export async function getAnime(id: string): Promise<Anime | null> {
  const snap = await get(ref(db, `animes/${id}`));
  if (!snap.exists()) return null;
  return { id, ...(snap.val() as object) } as Anime;
}

export async function createAnime(data: Omit<Anime, "id">) {
  const r = push(ref(db, "animes"));
  await set(r, { ...data, created_at: Date.now() });
  return r.key!;
}

export async function updateAnime(id: string, data: Partial<Anime>) {
  await update(ref(db, `animes/${id}`), data);
}

export async function deleteAnime(id: string) {
  // cascade delete episodes
  const eps = await listEpisodesOnce(id);
  const updates: Record<string, null> = { [`animes/${id}`]: null };
  for (const ep of eps) updates[`episodes/${ep.id}`] = null;
  await update(ref(db), updates);
}

// ---------- Episodes ----------
export function subscribeEpisodes(animeId: string, cb: (e: Episode[]) => void) {
  const q = query(ref(db, "episodes"), orderByChild("anime_id"), equalTo(animeId));
  return onValue(q, (snap) => {
    const list = objToList<Episode>(snap);
    list.sort((a, b) => (a.number || 0) - (b.number || 0));
    cb(list);
  });
}

export async function listEpisodesOnce(animeId: string): Promise<Episode[]> {
  const q = query(ref(db, "episodes"), orderByChild("anime_id"), equalTo(animeId));
  const snap = await get(q);
  const list = objToList<Episode>(snap);
  list.sort((a, b) => (a.number || 0) - (b.number || 0));
  return list;
}

export async function getEpisode(id: string): Promise<Episode | null> {
  const snap = await get(ref(db, `episodes/${id}`));
  if (!snap.exists()) return null;
  return { id, ...(snap.val() as object) } as Episode;
}

export async function createEpisode(data: Omit<Episode, "id">) {
  const r = push(ref(db, "episodes"));
  await set(r, { ...data, created_at: Date.now() });
  return r.key!;
}

export async function updateEpisode(id: string, data: Partial<Episode>) {
  await update(ref(db, `episodes/${id}`), data);
}

export async function deleteEpisode(id: string) {
  await remove(ref(db, `episodes/${id}`));
}
