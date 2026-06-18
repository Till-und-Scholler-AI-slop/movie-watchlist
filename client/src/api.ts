import type {
  SearchResponse,
  WatchlistItem,
  Stats,
  WatchStatus,
  WatchlistUpdate,
} from './types.js';

const API = '/api';

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

  listWatchlist(status?: WatchStatus): Promise<{ items: WatchlistItem[] }> {
    const qs = status ? `?status=${status}` : '';
    return http(`${API}/watchlist${qs}`);
  },

  addMovie(imdb_id: string): Promise<{ item: WatchlistItem }> {
    return http(`${API}/watchlist`, {
      method: 'POST',
      body: JSON.stringify({ imdb_id }),
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
};
