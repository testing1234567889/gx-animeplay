import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flag, Trash2, Check, ExternalLink } from "lucide-react";
import { subscribeReports, dismissReport, deleteReportedComment } from "../lib/progress";
import type { ReportedComment } from "../lib/types";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsAdmin,
});

function ReportsAdmin() {
  const [items, setItems] = useState<ReportedComment[] | null>(null);

  useEffect(() => subscribeReports(setItems), []);

  const onDismiss = async (r: ReportedComment) => {
    try { await dismissReport(r.id); toast.success("Dismissed"); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };
  const onDelete = async (r: ReportedComment) => {
    if (!confirm("Delete this comment and all related reports?")) return;
    try { await deleteReportedComment(r); toast.success("Comment deleted"); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Flag className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-semibold">Reported Comments</h2>
      </div>

      {items === null ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          No active reports. 🎉
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-xl bg-card p-4 ring-1 ring-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 ring-1 ring-amber-400/30">
                  {r.reason}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  reporter: {r.reporter_uid.slice(0, 8)}… · author: {r.comment_uid.slice(0, 8)}…
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                "{r.text_snippet}"
              </p>
              {r.custom_text && (
                <p className="mt-2 rounded-lg bg-background/60 p-2 text-xs text-muted-foreground ring-1 ring-white/5">
                  <span className="font-semibold text-foreground">Note:</span> {r.custom_text}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={`#`}
                  onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(r.episode_id); toast.success("Episode ID copied"); }}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Copy episode ID
                </a>
                <button
                  onClick={() => onDismiss(r)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25"
                >
                  <Check className="h-3.5 w-3.5" /> Dismiss
                </button>
                <button
                  onClick={() => onDelete(r)}
                  className="inline-flex items-center gap-1 rounded-lg bg-destructive/15 px-2.5 py-1.5 text-xs font-semibold text-destructive ring-1 ring-destructive/30 hover:bg-destructive/25"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete comment
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
