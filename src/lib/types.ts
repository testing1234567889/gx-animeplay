export type Anime = {
  id: string;
  title: string;
  description?: string;
  poster_url?: string;
  banner_url?: string;
  type?: string; // e.g. "Donghua", "Movie", "TV"
  status?: string; // "Ongoing" | "Completed"
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
  created_at?: number;
};
