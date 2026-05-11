import { ref, onValue, set } from "firebase/database";
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
