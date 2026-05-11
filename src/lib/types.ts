export type Anime = {
  id: string;
  title: string;
  description?: string;
  poster_url?: string;
  banner_url?: string;
  type?: string;
  status?: string;
  latest_ep?: string | number;
  isTrending?: boolean;
  isLatest?: boolean;
  isMovie?: boolean;
  isUpcoming?: boolean;
  schedule_day?: string;
  genres?: string[];
  globalRating?: number;
  ratingCount?: number;
  created_at?: number;
};

export type Episode = {
  id: string;
  anime_id: string;
  number: number;
  title?: string;
  dailymotion_id?: string;
  okru_id?: string;
  server1_data?: string;
  server1_name?: string;
  server2_data?: string;
  server2_name?: string;
  server3_data?: string;
  server3_name?: string;
  vip_only?: boolean;
  release_time?: number; // ms epoch when it became released
  skipStart?: number; // seconds
  skipEnd?: number; // seconds
  ratings?: Record<string, { uid: string; score: number }>;
  created_at?: number;
};

export type UserProfile = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  status?: "free" | "vip";
  vip_until?: number | null;
  banned?: boolean;
  ban_reason?: string;
  payment_status?: "none" | "pending" | "approved" | "rejected";
  isAdmin?: boolean;
  isModerator?: boolean;
  isBeta?: boolean;
  watchProgress?: Record<string, { lastMinute: number; percentage: number; updated_at?: number }>;
  created_at?: number;
};

export type Payment = {
  id: string;
  uid: string;
  email?: string;
  amount: number;
  proof_url: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  created_at: number;
  reviewed_at?: number;
};

export type Comment = {
  id: string;
  uid: string;
  email?: string;
  text: string;
  created_at: number;
  pinned?: boolean;
  parent_id?: string | null;
  isSpoiler?: boolean;
  reports?: Record<string, boolean>; // uid -> true
};

export type ReportedComment = {
  id: string;
  episode_id: string;
  comment_id: string;
  reporter_uid: string;
  reason: string;
  custom_text?: string;
  text_snippet: string;
  comment_uid: string;
  created_at: number;
};

export type Announcement = {
  enabled?: boolean;
  text?: string;
  href?: string;
};
