export type WatchStatus = 'want' | 'watching' | 'watched';

export interface SearchMovie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
}

export interface SearchResponse {
  movies: SearchMovie[];
  total: number;
  page: number;
  error?: string;
  using_fallback: boolean;
}

export interface WatchlistItem {
  id: number;
  imdb_id: string;
  title: string;
  year: string | null;
  poster: string | null;
  genre: string | null;
  director: string | null;
  plot: string | null;
  runtime: string | null;
  imdb_rating: string | null;
  status: WatchStatus;
  rating: number | null;
  notes: string | null;
  added_at: string;
  watched_at: string | null;
}

export interface Stats {
  summary: {
    total: number;
    watched: number;
    watching: number;
    want: number;
    avg_rating: number;
  };
  genres: { name: string; count: number }[];
}

export interface WatchlistUpdate {
  status?: WatchStatus;
  rating?: number | null;
  notes?: string | null;
}
