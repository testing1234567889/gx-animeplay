export function VipBadge({ vip, className = "" }: { vip: boolean; className?: string }) {
  if (vip) {
    return (
      <span
        className={
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black shadow-[0_0_12px_rgba(250,204,21,0.5)] " +
          className
        }
        style={{ background: "linear-gradient(135deg,#FDE68A,#F59E0B,#B45309)" }}
      >
        ★ VIP
      </span>
    );
  }
  return (
    <span
      className={
        "inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-white/10 " +
        className
      }
    >
      Free
    </span>
  );
}
