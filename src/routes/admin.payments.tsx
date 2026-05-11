import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { approvePayment, rejectPayment, subscribePayments } from "../lib/payments";
import type { Payment } from "../lib/types";
import { Skeleton } from "../components/Skeleton";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsAdmin,
});

function PaymentsAdmin() {
  const [items, setItems] = useState<Payment[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [reasonFor, setReasonFor] = useState<Payment | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => subscribePayments(setItems), []);

  const list = items?.filter((p) => filter === "all" || p.status === filter) ?? null;

  const onApprove = async (p: Payment) => {
    try {
      await approvePayment(p);
      toast.success("Approved — user upgraded to VIP");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };
  const submitReject = async () => {
    if (!reasonFor) return;
    try {
      await rejectPayment(reasonFor, reason || "Bukti tidak jelas");
      toast.success("Rejected");
      setReasonFor(null);
      setReason("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Payments</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="input max-w-[140px]"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {list === null ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          No {filter} payments.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((p) => (
            <li key={p.id} className="rounded-xl bg-card p-3 ring-1 ring-white/5">
              <div className="flex items-start gap-3">
                <a href={p.proof_url} target="_blank" rel="noreferrer" className="block h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-black/40">
                  <img src={p.proof_url} alt="proof" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                </a>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.email || p.uid}</div>
                  <div className="text-xs text-muted-foreground">Rp {p.amount.toLocaleString("id-ID")}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                  <div className="mt-1">
                    <span className={
                      "inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase " +
                      (p.status === "pending" ? "bg-yellow-500/20 text-yellow-300"
                        : p.status === "approved" ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300")
                    }>
                      {p.status}
                    </span>
                  </div>
                  {p.reason && <p className="mt-1 text-[11px] italic text-muted-foreground">"{p.reason}"</p>}
                </div>
              </div>
              {p.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onApprove(p)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500/20 py-2 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => { setReasonFor(p); setReason(""); }}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-500/15 py-2 text-xs font-semibold text-red-300 ring-1 ring-red-400/30 hover:bg-red-500/25"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {reasonFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setReasonFor(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold">Reject payment</h3>
            <p className="mt-1 text-xs text-muted-foreground">Add an optional reason for the user.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Bukti tidak jelas"
              className="input mt-3 resize-none"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setReasonFor(null)} className="flex-1 rounded-lg bg-white/5 py-2 text-sm">Cancel</button>
              <button onClick={submitReject} className="flex-1 rounded-lg bg-destructive py-2 text-sm font-semibold text-destructive-foreground">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
