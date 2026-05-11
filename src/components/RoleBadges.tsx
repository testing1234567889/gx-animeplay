import { Crown, Shield, ShieldCheck, Sparkles } from "lucide-react";
import type { UserProfile } from "../lib/types";

type Roles = {
  isAdmin?: boolean;
  isModerator?: boolean;
  isBeta?: boolean;
  isVip?: boolean;
};

const base =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 leading-none whitespace-nowrap";

export function RoleBadges({
  roles,
  className = "",
  size = "sm",
}: {
  roles: Roles;
  className?: string;
  size?: "sm" | "md";
}) {
  const items: React.ReactNode[] = [];
  const px = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  if (roles.isAdmin) {
    items.push(
      <span
        key="admin"
        className={base + " text-black ring-yellow-300/40 shadow-[0_0_10px_rgba(220,38,38,0.35)]"}
        style={{ background: "linear-gradient(135deg,#FCA5A5,#DC2626 55%,#FBBF24)" }}
      >
        <ShieldCheck className={px} /> Admin
      </span>,
    );
  }
  if (roles.isModerator) {
    items.push(
      <span
        key="mod"
        className={base + " bg-emerald-500/20 text-emerald-300 ring-emerald-400/40"}
      >
        <Shield className={px} /> Mod
      </span>,
    );
  }
  if (roles.isBeta) {
    items.push(
      <span
        key="beta"
        className={base + " bg-purple-500/20 text-purple-200 ring-purple-400/40"}
      >
        <Sparkles className={px} /> Beta
      </span>,
    );
  }
  if (roles.isVip) {
    items.push(
      <span
        key="vip"
        className={base + " text-black ring-yellow-300/50 shadow-[0_0_10px_rgba(250,204,21,0.4)]"}
        style={{ background: "linear-gradient(135deg,#FDE68A,#F59E0B,#B45309)" }}
      >
        <Crown className={px} /> VIP
      </span>,
    );
  }

  if (items.length === 0) {
    items.push(
      <span
        key="free"
        className={base + " bg-white/10 text-muted-foreground ring-white/10"}
      >
        Free
      </span>,
    );
  }

  return <div className={"flex flex-wrap items-center gap-1.5 " + className}>{items}</div>;
}

export function rolesFromProfile(p?: UserProfile | null): Roles {
  return {
    isAdmin: !!p?.isAdmin,
    isModerator: !!p?.isModerator,
    isBeta: !!p?.isBeta,
    isVip: p?.status === "vip",
  };
}
