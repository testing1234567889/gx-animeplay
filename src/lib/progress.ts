import { ref, update, set, push, onValue, remove, get } from "firebase/database";
import { db } from "./firebase";
import type { ReportedComment } from "./types";

// ---------- Watch Progress ----------
export async function saveWatchProgress(
  uid: string,
  episodeId: string,
  data: { lastMinute: number; percentage: number },
) {
  await update(ref(db, `users/${uid}/watchProgress/${episodeId}`), {
    ...data,
    updated_at: Date.now(),
  });
}

// ---------- Anime Ratings (per user, one rating per anime) ----------
export async function rateAnime(animeId: string, uid: string, score: number) {
  await set(ref(db, `animes/${animeId}/userRatings/${uid}`), { uid, score });
  // Recompute global average from all userRatings on this anime
  const snap = await get(ref(db, `animes/${animeId}/userRatings`));
  const v = (snap.val() as Record<string, { score: number }>) || {};
  const scores = Object.values(v).map((r) => Number(r.score) || 0);
  const count = scores.length;
  const avg = count ? scores.reduce((a, b) => a + b, 0) / count : 0;
  await update(ref(db, `animes/${animeId}`), {
    globalRating: Math.round(avg * 10) / 10,
    ratingCount: count,
  });
}

// ---------- Reports ----------
export async function reportComment(opts: {
  episodeId: string;
  commentId: string;
  reporterUid: string;
  reason: string;
  customText?: string;
  textSnippet: string;
  commentUid: string;
}) {
  // Mark the report on the comment
  await set(
    ref(db, `comments/${opts.episodeId}/${opts.commentId}/reports/${opts.reporterUid}`),
    true,
  );
  // Push to admin reports
  const r = push(ref(db, "admin_reports"));
  await set(r, {
    episode_id: opts.episodeId,
    comment_id: opts.commentId,
    reporter_uid: opts.reporterUid,
    reason: opts.reason,
    custom_text: opts.customText ?? "",
    text_snippet: opts.textSnippet.slice(0, 280),
    comment_uid: opts.commentUid,
    created_at: Date.now(),
  });
}

export function subscribeReports(cb: (rows: ReportedComment[]) => void) {
  return onValue(ref(db, "admin_reports"), (snap) => {
    const v = snap.val() as Record<string, any> | null;
    const list: ReportedComment[] = v
      ? Object.entries(v).map(([id, val]) => ({ id, ...(val as object) } as ReportedComment))
      : [];
    list.sort((a, b) => b.created_at - a.created_at);
    cb(list);
  });
}

export async function dismissReport(id: string) {
  await remove(ref(db, `admin_reports/${id}`));
}

// ---------- Video Reports ----------
export async function reportVideo(opts: {
  animeId: string;
  episodeId: string;
  reporterUid: string;
  reason: string;
  customText?: string;
}) {
  const r = push(ref(db, "admin_video_reports"));
  await set(r, {
    anime_id: opts.animeId,
    episode_id: opts.episodeId,
    reporter_uid: opts.reporterUid,
    reason: opts.reason,
    custom_text: opts.customText ?? "",
    created_at: Date.now(),
  });
}

export async function deleteReportedComment(report: ReportedComment) {
  await remove(ref(db, `comments/${report.episode_id}/${report.comment_id}`));
  // remove all admin reports tied to this comment
  const snap = await get(ref(db, "admin_reports"));
  const v = snap.val() as Record<string, any> | null;
  if (!v) return;
  const updates: Record<string, null> = {};
  for (const [id, val] of Object.entries(v)) {
    if ((val as any).comment_id === report.comment_id) {
      updates[`admin_reports/${id}`] = null;
    }
  }
  if (Object.keys(updates).length) await update(ref(db), updates);
}
