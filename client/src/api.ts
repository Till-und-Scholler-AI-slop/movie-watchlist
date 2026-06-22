import type {
  SearchResponse,
  WatchlistItem,
  Stats,
  WatchStatus,
  MediaType,
  WatchlistUpdate,
  Me,
  TitleFull,
  Follow,
  FollowedWatchlistItem,
  SharedWatchlistItem,
} from './types.js';

const API = '/api';

const IMG_BASE = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w500';

export function posterUrlFromPath(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${POSTER_SIZE}${path}`;
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  search(query: string, page = 1): Promise<SearchResponse> {
    const q = encodeURIComponent(query);
    return http<SearchResponse>(`${API}/search?q=${q}&page=${page}`);
  },

  listWatchlist(
    status?: WatchStatus,
    mediaType?: MediaType,
  ): Promise<{ items: WatchlistItem[] }> {
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (mediaType) params.push(`media_type=${mediaType}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return http(`${API}/watchlist${qs}`);
  },

  addTitle(tmdb_id: number, media_type: MediaType): Promise<{ item: WatchlistItem }> {
    return http(`${API}/watchlist`, {
      method: 'POST',
      body: JSON.stringify({ tmdb_id, media_type }),
    });
  },

  updateItem(id: number, patch: WatchlistUpdate): Promise<{ item: WatchlistItem }> {
    return http(`${API}/watchlist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  removeItem(id: number): Promise<void> {
    return http(`${API}/watchlist/${id}`, { method: 'DELETE' });
  },

  stats(): Promise<Stats> {
    return http(`${API}/stats`);
  },

  me(): Promise<Me> {
    return http<Me>(`${API}/me`);
  },

  getTitleFull(tmdb_id: number, media_type: MediaType): Promise<TitleFull> {
    return http<TitleFull>(`${API}/titles/${tmdb_id}/full?type=${media_type}`);
  },

  listFollows(): Promise<{ follows: Follow[] }> {
    return http(`${API}/follows`);
  },

  follow(query: string): Promise<{ user: Follow }> {
    return http(`${API}/follows`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },

  unfollow(uid: string): Promise<void> {
    return http(`${API}/follows/${encodeURIComponent(uid)}`, { method: 'DELETE' });
  },

  getFollowedWatchlist(uid: string): Promise<{ items: FollowedWatchlistItem[] }> {
    return http(`${API}/follows/${encodeURIComponent(uid)}/watchlist`);
  },

  getSharedWatchlist(uid: string): Promise<{ items: SharedWatchlistItem[] }> {
    return http(`${API}/follows/${encodeURIComponent(uid)}/shared`);
  },
};
