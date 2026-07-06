import { ref, push, set, update, onValue, get, query, orderByChild, equalTo } from "firebase/database";
import { db } from "./firebase";
import { setUserPaymentStatus, setUserStatus } from "./users";
import type { Payment } from "./types";

export const DANA_NUMBER = "082293633547";
export const VIP_PRICE = 50000;

export async function submitPayment(args: { uid: string; email?: string; proof_url: string }) {
  const r = push(ref(db, "payments"));
  // Amount is fixed server-side via Firebase Security Rules; client never supplies it.
  const payload: Omit<Payment, "id"> = {
    uid: args.uid,
    email: args.email,
    amount: VIP_PRICE,
    proof_url: args.proof_url,
    status: "pending",
    created_at: Date.now(),
  };
  await set(r, payload);
  await setUserPaymentStatus(args.uid, "pending");
  return r.key!;
}

export function subscribePayments(cb: (list: Payment[]) => void) {
  return onValue(ref(db, "payments"), (snap) => {
    const v = snap.val() as Record<string, any> | null;
    const list = v
      ? Object.entries(v).map(([id, val]) => ({ id, ...(val as object) } as Payment))
      : [];
    list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    cb(list);
  });
}

export function subscribeUserPayments(uid: string, cb: (list: Payment[]) => void) {
  // Query only this user's payments — avoids downloading the entire /payments node.
  // Requires an index on 'uid' in Firebase RTDB rules ("payments": { ".indexOn": ["uid"] }).
  const q = query(ref(db, "payments"), orderByChild("uid"), equalTo(uid));
  return onValue(q, (snap) => {
    const v = snap.val() as Record<string, any> | null;
    const list = v
      ? Object.entries(v).map(([id, val]) => ({ id, ...(val as object) } as Payment))
      : [];
    list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    cb(list);
  });
}

export async function approvePayment(p: Payment) {
  await update(ref(db, `payments/${p.id}`), { status: "approved", reviewed_at: Date.now(), reason: "" });
  await setUserStatus(p.uid, "vip");
  await setUserPaymentStatus(p.uid, "approved");
}

export async function rejectPayment(p: Payment, reason: string) {
  await update(ref(db, `payments/${p.id}`), { status: "rejected", reason, reviewed_at: Date.now() });
  await setUserPaymentStatus(p.uid, "rejected");
}

export async function getLatestPendingForUser(uid: string) {
  // Scoped query — do not fetch the full /payments node from the client.
  const q = query(ref(db, "payments"), orderByChild("uid"), equalTo(uid));
  const snap = await get(q);
  const v = snap.val() as Record<string, any> | null;
  if (!v) return null;
  const mine = Object.entries(v)
    .map(([id, val]) => ({ id, ...(val as object) } as Payment))
    .sort((a, b) => b.created_at - a.created_at);
  return mine[0] ?? null;
}
