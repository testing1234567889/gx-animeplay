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
  created_at?: number;
};

export type Episode = {
  id: string;
  anime_id: string;
  number: number;
  title?: string;
  dailymotion_id?: string;
  okru_id?: string;
  vip_only?: boolean;
  release_time?: number; // ms epoch when it became released
  created_at?: number;
};

export type UserProfile = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  status?: "free" | "vip";
  vip_until?: number | null;
  banned?: boolean;
  ban_reason?: string;
  payment_status?: "none" | "pending" | "approved" | "rejected";
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
  status?: "free" | "vip";
  text: string;
  created_at: number;
};

export type Announcement = {
  enabled?: boolean;
  text?: string;
  href?: string;
};
