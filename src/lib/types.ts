export type Anime = {
  id: string;
  title: string;
  description?: string;
  poster_url?: string;
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
