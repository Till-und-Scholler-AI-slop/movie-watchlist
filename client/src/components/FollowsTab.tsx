import { useCallback, useEffect, useState } from 'react';
import type { Follow, FollowedWatchlistItem, SharedWatchlistItem, WatchStatus } from '../types.js';
import { api, posterUrlFromPath } from '../api.js';
import { Poster } from './Poster.js';
import { Stars } from './Stars.js';
import { StatusBadge } from './StatusBadge.js';
import { MediaTypeBadge } from './MediaTypeBadge.js';

type SubView = 'follows' | 'shared';

function formatRuntime(min: number | null): string | null {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function formatShowInfo(seasons: number | null, episodes: number | null): string | null {
  if (!seasons && !episodes) return null;
  const parts: string[] = [];
  if (seasons) parts.push(`${seasons} Staffel${seasons !== 1 ? 'n' : ''}`);
  if (episodes) parts.push(`${episodes} Episode${episodes !== 1 ? 'n' : ''}`);
  return parts.join(' · ');
}

function userDisplayName(f: { name: string | null; username: string | null; uid: string }): string {
  return f.name || f.username || f.uid;
}

function userInitial(name: string): string {
  const c = name.trim().charAt(0);
  return c ? c.toUpperCase() : '?';
}

export function FollowsTab() {
  const [subView, setSubView] = useState<SubView>('follows');

  // Follow list
  const [follows, setFollows] = useState<Follow[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Selected followed user's watchlist
  const [selectedFollow, setSelectedFollow] = useState<Follow | null>(null);
  const [followedItems, setFollowedItems] = useState<FollowedWatchlistItem[]>([]);
  const [followedLoading, setFollowedLoading] = useState(false);

  // Shared watchlist
  const [sharedFriend, setSharedFriend] = useState<Follow | null>(null);
  const [sharedItems, setSharedItems] = useState<SharedWatchlistItem[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);

  const refreshFollows = useCallback(async () => {
    setFollowsLoading(true);
    try {
      const { follows } = await api.listFollows();
      setFollows(follows);
    } catch {
      /* ignore */
    } finally {
      setFollowsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshFollows();
  }, [refreshFollows]);

  async function handleFollow() {
    const q = addQuery.trim();
    if (!q) return;
    setAdding(true);
    setAddError(null);
    try {
      await api.follow(q);
      setAddQuery('');
      await refreshFollows();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Fehler beim Folgen');
    } finally {
      setAdding(false);
    }
  }

  async function handleUnfollow(f: Follow) {
    if (!confirm(`${userDisplayName(f)} entfolgen?`)) return;
    try {
      await api.unfollow(f.uid);
      if (selectedFollow?.uid === f.uid) {
        setSelectedFollow(null);
        setFollowedItems([]);
      }
      if (sharedFriend?.uid === f.uid) {
        setSharedFriend(null);
        setSharedItems([]);
      }
      await refreshFollows();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler beim Entfolgen');
    }
  }

  async function openFollowedWatchlist(f: Follow) {
    setSelectedFollow(f);
    setFollowedLoading(true);
    setFollowedItems([]);
    try {
      const { items } = await api.getFollowedWatchlist(f.uid);
      setFollowedItems(items);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setFollowedLoading(false);
    }
  }

  async function loadShared(f: Follow) {
    setSharedFriend(f);
    setSharedLoading(true);
    setSharedItems([]);
    try {
      const { items } = await api.getSharedWatchlist(f.uid);
      setSharedItems(items);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setSharedLoading(false);
    }
  }

  return (
    <section>
      {/* Add form */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <input
            value={addQuery}
            onChange={(e) => setAddQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleFollow(); }}
            placeholder="Username oder UID…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-3 pr-3 text-sm text-slate-100 outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          type="button"
          onClick={handleFollow}
          disabled={adding || !addQuery.trim()}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-300 disabled:opacity-40"
        >
          {adding ? '…' : 'Folgen'}
        </button>
      </div>
      {addError && (
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {addError}
        </p>
      )}

      {/* Sub-tabs */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => { setSubView('follows'); setSelectedFollow(null); }}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            subView === 'follows'
              ? 'border-amber-500 bg-amber-500/15 text-amber-300'
              : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-surface-2)]'
          }`}
        >
          Ich folge ({follows.length})
        </button>
        <button
          type="button"
          onClick={() => setSubView('shared')}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            subView === 'shared'
              ? 'border-amber-500 bg-amber-500/15 text-amber-300'
              : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-surface-2)]'
          }`}
        >
          Gemeinsam
        </button>
      </div>

      {/* "Ich folge" view */}
      {subView === 'follows' && (
        <>
          {selectedFollow ? (
            <div>
              <button
                type="button"
                onClick={() => { setSelectedFollow(null); setFollowedItems([]); }}
                className="mb-4 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-slate-200 hover:bg-[var(--color-surface-2)]"
              >
                ← Zurück zur Liste
              </button>
              <h3 className="mb-4 text-sm font-semibold text-slate-200">
                Watchlist von {userDisplayName(selectedFollow)}
              </h3>
              {followedLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">Laden…</p>
              ) : followedItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  {userDisplayName(selectedFollow)} hat noch nichts auf der Watchlist.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {followedItems.map((item) => (
                    <FollowedWatchlistCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          ) : followsLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Laden…</p>
          ) : follows.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">
                Du folgst noch niemandem. Füge jemanden mit Username oder UID oben hinzu.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {follows.map((f) => (
                <div
                  key={f.uid}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <button
                    type="button"
                    onClick={() => void openFollowedWatchlist(f)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-500 text-sm font-bold text-black">
                      {userInitial(userDisplayName(f))}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">
                        {userDisplayName(f)}
                      </p>
                      {f.username && f.name && (
                        <p className="truncate text-xs text-slate-500">@{f.username}</p>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUnfollow(f)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/10"
                  >
                    Entfolgen
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* "Gemeinsam" view */}
      {subView === 'shared' && (
        <>
          {follows.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">
                Du folgst noch niemandem. Sobald du jemandem folgst, kannst du
                gemeinsame Titel entdecken.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Freund auswählen
                </label>
                <select
                  value={sharedFriend?.uid ?? ''}
                  onChange={(e) => {
                    const f = follows.find((x) => x.uid === e.target.value);
                    if (f) void loadShared(f);
                  }}
                  className="w-full max-w-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 px-3 text-sm text-slate-100 outline-none focus:border-amber-500/50"
                >
                  <option value="">— wählen —</option>
                  {follows.map((f) => (
                    <option key={f.uid} value={f.uid}>
                      {userDisplayName(f)}
                    </option>
                  ))}
                </select>
              </div>

              {!sharedFriend ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Wähle einen Freund aus, um eure gemeinsamen Titel zu sehen.
                </p>
              ) : sharedLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">Laden…</p>
              ) : sharedItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">
                    Ihr habt aktuell keine gemeinsamen Titel auf der Watchlist.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="mb-4 text-sm text-slate-400">
                    {sharedItems.length} gemeinsame {sharedItems.length === 1 ? 'Titel' : 'Titel'} mit{' '}
                    {userDisplayName(sharedFriend)}
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {sharedItems.map((item) => (
                      <SharedWatchlistCard key={`${item.tmdb_id}-${item.media_type}`} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

function FollowedWatchlistCard({ item }: { item: FollowedWatchlistItem }) {
  const poster = posterUrlFromPath(item.poster_path);
  const showOriginal =
    item.original_title &&
    item.original_title !== item.title &&
    item.original_title.length > 0;
  const meta = item.media_type === 'tv'
    ? formatShowInfo(item.number_of_seasons, item.number_of_episodes)
    : formatRuntime(item.runtime);

  return (
    <div className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="h-36 w-24 shrink-0 overflow-hidden rounded-md">
        <Poster src={poster} alt={item.title} className="h-full w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-0.5 flex items-center gap-1.5">
              <MediaTypeBadge mediaType={item.media_type} />
            </div>
            <h3 className="truncate text-base font-semibold" title={item.title}>{item.title}</h3>
            {showOriginal && (
              <p className="truncate text-xs italic text-slate-500" title={item.original_title ?? undefined}>
                {item.original_title}
              </p>
            )}
          </div>
          <StatusBadge status={item.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {item.year && <span>{item.year}</span>}
          {meta && <span>{meta}</span>}
          {item.tmdb_rating !== null && item.tmdb_rating > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="text-amber-400">{'\u2605'}</span>
              {item.tmdb_rating.toFixed(1)}
            </span>
          )}
        </div>
        {item.genre && <p className="line-clamp-1 text-xs text-slate-500">{item.genre}</p>}
        {item.plot && <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{item.plot}</p>}
        <div className="mt-auto pt-1">
          <Stars value={item.rating} size="sm" />
        </div>
      </div>
    </div>
  );
}

function SharedWatchlistCard({ item }: { item: SharedWatchlistItem }) {
  const poster = posterUrlFromPath(item.poster_path);
  const showOriginal =
    item.original_title &&
    item.original_title !== item.title &&
    item.original_title.length > 0;
  const meta = item.media_type === 'tv'
    ? formatShowInfo(item.number_of_seasons, item.number_of_episodes)
    : formatRuntime(item.runtime);

  return (
    <div className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="h-36 w-24 shrink-0 overflow-hidden rounded-md">
        <Poster src={poster} alt={item.title} className="h-full w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-0.5 flex items-center gap-1.5">
              <MediaTypeBadge mediaType={item.media_type} />
            </div>
            <h3 className="truncate text-base font-semibold" title={item.title}>{item.title}</h3>
            {showOriginal && (
              <p className="truncate text-xs italic text-slate-500" title={item.original_title ?? undefined}>
                {item.original_title}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {item.year && <span>{item.year}</span>}
          {meta && <span>{meta}</span>}
          {item.tmdb_rating !== null && item.tmdb_rating > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="text-amber-400">{'\u2605'}</span>
              {item.tmdb_rating.toFixed(1)}
            </span>
          )}
        </div>
        {item.genre && <p className="line-clamp-1 text-xs text-slate-500">{item.genre}</p>}
        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-[var(--color-border)] pt-2">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Du</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={item.my_status} />
              <Stars value={item.my_rating} size="sm" />
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Freund</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={item.their_status} />
              <Stars value={item.their_rating} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}