import { ref, get, set, update, onValue } from "firebase/database";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import type { UserProfile } from "./types";

/**
 * Creates the RTDB profile node on first sign-in (Google or admin email).
 * Always guarantees the `isvip` flag node exists.
 */
export async function ensureUserProfile(u: User) {
  const r = ref(db, `users/${u.uid}`);
  const snap = await get(r);
  if (!snap.exists()) {
    const initial: Omit<UserProfile, "uid"> = {
      email: u.email ?? null,
      displayName: u.displayName ?? null,
      photoURL: u.photoURL ?? null,
      status: "free",
      isvip: false,
      banned: false,
      payment_status: "none",
      created_at: Date.now(),
    };
    await set(r, initial);
    return { uid: u.uid, ...initial } as UserProfile;
  }

  const val = (snap.val() ?? {}) as Partial<UserProfile>;
  const patch: Record<string, unknown> = {};
  if (val.isvip === undefined) patch["isvip"] = val.status === "vip";
  if (!val.email && u.email) patch["email"] = u.email;
  if (!val.displayName && u.displayName) patch["displayName"] = u.displayName;
  if (!val.photoURL && u.photoURL) patch["photoURL"] = u.photoURL;
  if (Object.keys(patch).length) {
    try {
      await update(r, patch);
    } catch (e) {
      console.error("profile backfill failed", e);
    }
  }
  return { uid: u.uid, ...val, ...patch } as UserProfile;
}

export function subscribeUserProfile(uid: string, cb: (p: UserProfile | null) => void) {
  return onValue(ref(db, `users/${uid}`), (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ uid, ...(snap.val() as object) } as UserProfile);
  });
}

/** Reads the RTDB admin allowlist: `/admins/{uid} === true`. */
export function subscribeAdminFlag(uid: string, cb: (isAdmin: boolean) => void) {
  return onValue(
    ref(db, `admins/${uid}`),
    (snap) => cb(snap.val() === true),
    () => cb(false),
  );
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
  await update(ref(db, `users/${uid}`), { status, isvip: status === "vip" });
}

export async function setUserBanned(uid: string, banned: boolean, reason = "") {
  await update(ref(db, `users/${uid}`), { banned, ban_reason: reason });
}

export async function setUserPaymentStatus(uid: string, payment_status: UserProfile["payment_status"]) {
  await update(ref(db, `users/${uid}`), { payment_status });
}

export async function setUserRole(
  uid: string,
  role: "isModerator" | "isBeta",
  value: boolean,
) {
  await update(ref(db, `users/${uid}`), { [role]: value });
}

export function isVip(p?: UserProfile | null) {
  return !!p && (p.status === "vip" || p.isvip === true);
}

/** Admin allowlist writes — only the root admin UID may do this (enforced by rules). */
export async function setAdminFlag(uid: string, value: boolean) {
  await set(ref(db, `admins/${uid}`), value ? true : null);
}

export function subscribeAdminMap(cb: (m: Record<string, boolean>) => void) {
  return onValue(
    ref(db, "admins"),
    (snap) => cb((snap.val() as Record<string, boolean> | null) ?? {}),
    () => cb({}),
  );
}
