import { ref, get, set, update, onValue } from "firebase/database";
import { db } from "./firebase";
import type { UserProfile } from "./types";

export async function ensureUserProfile(uid: string, email: string | null) {
  const r = ref(db, `users/${uid}`);
  const snap = await get(r);
  if (!snap.exists()) {
    const initial: Omit<UserProfile, "uid"> = {
      email,
      status: "free",
      banned: false,
      payment_status: "none",
      created_at: Date.now(),
    };
    await set(r, initial);
    return { uid, ...initial } as UserProfile;
  }
  return { uid, ...(snap.val() as object) } as UserProfile;
}

export function subscribeUserProfile(uid: string, cb: (p: UserProfile | null) => void) {
  return onValue(ref(db, `users/${uid}`), (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ uid, ...(snap.val() as object) } as UserProfile);
  });
}

export function subscribeAllUsers(cb: (users: UserProfile[]) => void) {
  return onValue(ref(db, "users"), (snap) => {
    const v = snap.val() as Record<string, any> | null;
    const list = v
      ? Object.entries(v).map(([uid, val]) => ({ uid, ...(val as object) } as UserProfile))
      : [];
    list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    cb(list);
  });
}

export async function setUserStatus(uid: string, status: "free" | "vip") {
  await update(ref(db, `users/${uid}`), { status });
}

export async function setUserBanned(uid: string, banned: boolean, reason = "") {
  await update(ref(db, `users/${uid}`), { banned, ban_reason: reason });
}

export async function setUserPaymentStatus(uid: string, payment_status: UserProfile["payment_status"]) {
  await update(ref(db, `users/${uid}`), { payment_status });
}

export async function setUserRole(
  uid: string,
  role: "isAdmin" | "isModerator" | "isBeta",
  value: boolean,
) {
  await update(ref(db, `users/${uid}`), { [role]: value });
}

export function isVip(p?: UserProfile | null) {
  return !!p && p.status === "vip";
}
