import { ref, onValue, set, get } from "firebase/database";
import { db } from "./firebase";
import type { Announcement } from "./types";

export function subscribeAnnouncement(cb: (a: Announcement | null) => void) {
  return onValue(ref(db, "settings/announcement"), (snap) => {
    cb((snap.val() as Announcement) ?? null);
  });
}

export async function setAnnouncement(a: Announcement) {
  await set(ref(db, "settings/announcement"), a);
}

export function subscribeSiteLogo(cb: (url: string | null) => void) {
  return onValue(ref(db, "settings/site_logo_url"), (snap) => {
    const v = snap.val();
    cb(typeof v === "string" && v.trim() ? v : null);
  });
}

export async function setSiteLogo(url: string) {
  await set(ref(db, "settings/site_logo_url"), url.trim());
}

export async function getPublicBio(uid: string): Promise<string> {
  const snap = await get(ref(db, `users_public/${uid}/bio`));
  return (snap.val() as string) ?? "";
}

export async function setPublicBio(uid: string, bio: string) {
  await set(ref(db, `users_public/${uid}/bio`), bio.slice(0, 160));
}
