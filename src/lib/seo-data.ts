// SSR-safe metadata fetching for social share previews.
// Uses the Firebase RTDB REST API (plain fetch) so it works both in the
// browser and inside the server runtime, where the realtime SDK's socket
// transport is unavailable.

const DB_URL = "https://lovable-animestream-default-rtdb.firebaseio.com";

export type SeoAnime = {
  title?: string;
  description?: string;
  poster_url?: string;
  banner_url?: string;
  type?: string;
  genres?: string[];
  latest_ep?: string | number;
};

export type SeoEpisode = {
  number?: number;
  title?: string;
  anime_id?: string;
};

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${DB_URL}/${path}.json`);
    if (!res.ok) return null;
    const data = (await res.json()) as T | null;
    return data ?? null;
  } catch {
    return null;
  }
}

export function fetchAnimeMeta(animeId: string) {
  return readJson<SeoAnime>(`animes/${encodeURIComponent(animeId)}`);
}

export function fetchEpisodeMeta(episodeId: string) {
  return readJson<SeoEpisode>(`episodes/${encodeURIComponent(episodeId)}`);
}

/** Trim text to a social-friendly meta description length. */
export function clampDescription(text: string | undefined, max = 155) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Only absolute https images are valid social previews. */
export function safeImage(url: string | undefined | null) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

export const SITE_URL = "https://gx-animeplay.lovable.app";
