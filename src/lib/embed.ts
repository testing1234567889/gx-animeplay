/**
 * Universal embed resolver.
 *
 * Admins paste a FULL embed URL (any platform) — Dailymotion, OK.ru, YouTube,
 * Filemoon, Mp4upload, direct .mp4, etc. Order does not matter: each server
 * slot accepts any provider. Legacy rows that only stored a bare video ID are
 * still supported through light heuristics.
 */

export type ResolvedEmbed =
  | { kind: "none" }
  | { kind: "video"; src: string }
  | { kind: "iframe"; src: string };

const isUrl = (v: string) => /^https?:\/\//i.test(v);

function fromKnownPage(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    // Dailymotion watch page -> geo player embed
    if (host.endsWith("dailymotion.com")) {
      const m = u.pathname.match(/\/video\/([A-Za-z0-9]+)/);
      if (m) return `https://geo.dailymotion.com/player.html?video=${m[1]}`;
    }
    if (host === "dai.ly") {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://geo.dailymotion.com/player.html?video=${id}`;
    }
    // OK.ru watch page -> videoembed
    if (host.endsWith("ok.ru") || host.endsWith("odnoklassniki.ru")) {
      const m = u.pathname.match(/\/video\/(\d+)/);
      if (m) return `https://ok.ru/videoembed/${m[1]}`;
    }
    // YouTube watch / short links -> embed
    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

/** Extracts the src from a pasted full `<iframe ...>` snippet. */
function fromIframeSnippet(raw: string): string | null {
  const m = raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

export function resolveEmbed(raw?: string | null): ResolvedEmbed {
  const value = (raw ?? "").trim();
  if (!value) return { kind: "none" };

  const snippet = fromIframeSnippet(value);
  const candidate = snippet ?? value;

  if (isUrl(candidate)) {
    const path = candidate.toLowerCase().split("?")[0];
    if (/\.(mp4|m4v|webm|ogg)$/.test(path)) return { kind: "video", src: candidate };
    return { kind: "iframe", src: fromKnownPage(candidate) ?? candidate };
  }

  // Legacy bare IDs
  if (/^\d{8,}$/.test(candidate)) return { kind: "iframe", src: `https://ok.ru/videoembed/${candidate}` };
  if (/^[xk][A-Za-z0-9]{4,}$/.test(candidate))
    return { kind: "iframe", src: `https://geo.dailymotion.com/player.html?video=${candidate}` };

  return { kind: "none" };
}

/** Short human label for admin lists. */
export function embedHost(raw?: string | null): string {
  const r = resolveEmbed(raw);
  if (r.kind === "none") return "—";
  try {
    return new URL(r.src).hostname.replace(/^www\./, "");
  } catch {
    return "embed";
  }
}
