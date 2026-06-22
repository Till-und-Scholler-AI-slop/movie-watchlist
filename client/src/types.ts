export type WatchStatus = 'want' | 'watching' | 'watched';
export type MediaType = 'movie' | 'tv';

export interface SearchTitle {
  tmdb_id: number;
  media_type: MediaType;
  title_de: string;
  title_original: string;
  year: string;
  poster_url: string | null;
  overview_de: string;
  vote_average: number;
}

export interface SearchResponse {
  titles: SearchTitle[];
  total: number;
  page: number;
  error?: string;
  using_fallback: boolean;
}

export interface WatchlistItem {
  id: number;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  original_title: string | null;
  year: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  genre: string | null;
  director: string | null;
  plot: string | null;
  tagline: string | null;
  runtime: number | null;
  tmdb_rating: number | null;
  imdb_id: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
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
    movies: number;
    shows: number;
  };
  genres: { name: string; count: number }[];
}

export interface WatchlistUpdate {
  status?: WatchStatus;
  rating?: number | null;
  notes?: string | null;
}

export interface Me {
  uid: string;
  username: string | null;
  email: string | null;
  name: string | null;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  profile_url: string | null;
}

export interface SimilarTitle {
  tmdb_id: number;
  media_type: MediaType;
  title_de: string;
  year: string;
  poster_path: string | null;
  poster_url: string | null;
  vote_average: number;
  overview_de: string;
}

export interface TitleDetailData {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  original_title: string | null;
  year: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  genre: string | null;
  director: string | null;
  plot: string | null;
  tagline: string | null;
  runtime: number | null;
  tmdb_rating: number;
  imdb_id: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
}

export interface WatchlistEntrySummary {
  id: number;
  status: WatchStatus;
  rating: number | null;
  notes: string | null;
}

export interface TitleFull {
  title: TitleDetailData;
  cast: CastMember[];
  crew_top: { job: string; name: string }[];
  trailer_key: string | null;
  trailer_name: string | null;
  similar: SimilarTitle[];
  watchlist: WatchlistEntrySummary | null;
}