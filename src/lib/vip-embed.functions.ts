import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-side VIP embed gate.
 *
 * Enforces the VIP paywall on the backend instead of trusting client-side
 * checks. The client sends its Firebase ID token; the server verifies it
 * against Google Identity Toolkit, then reads /users/{uid}/status and
 * /episodes/{episodeId} from Firebase RTDB REST (rules apply via the
 * ?auth=<idToken> query param). Embed IDs are returned only when the
 * caller is VIP or the episode's 30-minute early-access window has
 * elapsed.
 *
 * Firebase Realtime Database Security Rules MUST also be deployed
 * (see FIREBASE_SECURITY_RULES.md) — this function is the app-level
 * enforcement layer that complements them.
 */

const FIREBASE_API_KEY = "AIzaSyBpsA9-X9ckiyz2erxurJdLOzv-Deoi7R0";
const FIREBASE_DB_URL = "https://animeplay-738a4-default-rtdb.firebaseio.com";
const VIP_DELAY_MS = 30 * 60 * 1000;

const InputSchema = z.object({
  idToken: z.string().min(10),
  animeId: z.string().min(1),
  episodeId: z.string().min(1),
});

export const getVipEmbed = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    // 1. Verify Firebase ID token
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken: data.idToken }),
      },
    );
    if (!verifyRes.ok) {
      throw new Response("Unauthorized", { status: 401 });
    }
    const verifyBody = (await verifyRes.json()) as { users?: Array<{ localId: string }> };
    const uid = verifyBody.users?.[0]?.localId;
    if (!uid) throw new Response("Unauthorized", { status: 401 });

    // 2. Fetch the episode (rules apply via ?auth=)
    const epRes = await fetch(
      `${FIREBASE_DB_URL}/episodes/${encodeURIComponent(data.episodeId)}.json?auth=${encodeURIComponent(data.idToken)}`,
    );
    if (!epRes.ok) throw new Response("Episode not found", { status: 404 });
    const ep = (await epRes.json()) as null | {
      anime_id?: string;
      vip_only?: boolean;
      release_time?: number;
      created_at?: number;
      server1_data?: string;
      server2_data?: string;
      server3_data?: string;
      server1_name?: string;
      server2_name?: string;
      server3_name?: string;
      dailymotion_id?: string;
      okru_id?: string;
      download_url?: string;
    };
    if (!ep) throw new Response("Episode not found", { status: 404 });
    if (ep.anime_id && ep.anime_id !== data.animeId) {
      throw new Response("Episode not found", { status: 404 });
    }

    // 3. Gate: VIP status or early-access window elapsed
    const release = ep.release_time ?? ep.created_at ?? 0;
    const windowElapsed = Date.now() >= release + VIP_DELAY_MS;

    if (ep.vip_only && !windowElapsed) {
      const userRes = await fetch(
        `${FIREBASE_DB_URL}/users/${encodeURIComponent(uid)}/status.json?auth=${encodeURIComponent(data.idToken)}`,
      );
      const status = userRes.ok ? ((await userRes.json()) as string | null) : null;
      if (status !== "vip") {
        throw new Response("VIP subscription required", { status: 403 });
      }
    }

    // 4. Return the embed payload
    return {
      server1_data: ep.server1_data || ep.dailymotion_id || "",
      server2_data: ep.server2_data || ep.okru_id || "",
      server3_data: ep.server3_data || "",
      server1_name: ep.server1_name || "Server 1",
      server2_name: ep.server2_name || "Server 2",
      server3_name: ep.server3_name || "Server 3",
      download_url: ep.download_url || "",
    };
  });
