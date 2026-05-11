import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { setUserBanned, setUserStatus, setUserRole, subscribeAllUsers } from "../lib/users";
import type { UserProfile } from "../lib/types";
import { Skeleton } from "../components/Skeleton";
import { RoleBadges, rolesFromProfile } from "../components/RoleBadges";

export const Route = createFileRoute("/admin/users")({
  component: UsersAdmin,
});

function UsersAdmin() {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [q, setQ] = useState("");
  const [reasonFor, setReasonFor] = useState<UserProfile | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => subscribeAllUsers(setUsers), []);

  const list = users?.filter((u) =>
    !q.trim() ? true : (u.email ?? "").toLowerCase().includes(q.toLowerCase()),
  ) ?? null;

  const toggleVip = async (u: UserProfile) => {
    try {
      await setUserStatus(u.uid, u.status === "vip" ? "free" : "vip");
      toast.success(u.status === "vip" ? "Demoted to free" : "Upgraded to VIP");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const toggleBan = async (u: UserProfile) => {
    if (u.banned) {
      try { await setUserBanned(u.uid, false, ""); toast.success("Unbanned"); }
      catch (e: any) { toast.error(e?.message ?? "Failed"); }
    } else {
      setReasonFor(u); setReason("");
    }
  };

  const submitBan = async () => {
    if (!reasonFor) return;
    try {
      await setUserBanned(reasonFor.uid, true, reason || "Violation of community guidelines");
      toast.success("User banned");
      setReasonFor(null);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold flex-1">Users</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email…"
          className="input max-w-[220px]"
        />
      </div>

      {list === null ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">No users.</div>
      ) : (
        <ul className="space-y-2">
          {list.map((u) => {
            const toggleRole = async (role: "isAdmin" | "isModerator" | "isBeta") => {
              try {
                await setUserRole(u.uid, role, !u[role]);
                toast.success(`${role} ${!u[role] ? "enabled" : "disabled"}`);
              } catch (e: any) { toast.error(e?.message ?? "Failed"); }
            };
            return (
            <li key={u.uid} className="rounded-xl bg-card p-3 ring-1 ring-white/5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {(u.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{u.email || u.uid}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <RoleBadges roles={rolesFromProfile(u)} />
                    {u.banned && <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-bold uppercase tracking-wider text-red-300 ring-1 ring-red-400/40">BANNED</span>}
                    {u.payment_status && u.payment_status !== "none" && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5">pay: {u.payment_status}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <RoleToggle active={!!u.isAdmin} label="Admin" onClick={() => toggleRole("isAdmin")} accent="red" />
                <RoleToggle active={!!u.isModerator} label="Mod" onClick={() => toggleRole("isModerator")} accent="green" />
                <RoleToggle active={!!u.isBeta} label="Beta" onClick={() => toggleRole("isBeta")} accent="purple" />
                <button
                  onClick={() => toggleVip(u)}
                  className="rounded-lg bg-yellow-500/15 px-2.5 py-1.5 text-xs font-semibold text-yellow-300 ring-1 ring-yellow-400/30 hover:bg-yellow-500/25"
                >
                  {u.status === "vip" ? "Demote VIP" : "Make VIP"}
                </button>
                <button
                  onClick={() => toggleBan(u)}
                  className={
                    "ml-auto rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 " +
                    (u.banned
                      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30 hover:bg-emerald-500/25"
                      : "bg-red-500/15 text-red-300 ring-red-400/30 hover:bg-red-500/25")
                  }
                >
                  {u.banned ? "Unban" : "Ban"}
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      )}

      {reasonFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setReasonFor(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold">Ban {reasonFor.email}</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for ban"
              className="input mt-3 resize-none"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setReasonFor(null)} className="flex-1 rounded-lg bg-white/5 py-2 text-sm">Cancel</button>
              <button onClick={submitBan} className="flex-1 rounded-lg bg-destructive py-2 text-sm font-semibold text-destructive-foreground">Ban user</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
