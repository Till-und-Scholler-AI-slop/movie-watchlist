import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SearchMovie, WatchlistItem, WatchStatus, Stats } from './types.js';
import { api } from './api.js';
import { SearchResultCard } from './components/SearchResultCard.js';
import { WatchlistCard } from './components/WatchlistCard.js';
import { EditModal } from './components/EditModal.js';
import { StatsBar } from './components/StatsBar.js';
import { STATUS_LIST, STATUS_LABELS } from './components/StatusBadge.js';

type View = 'search' | 'watchlist' | 'stats';

export function App() {
  const [view, setView] = useState<View>('search');

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchMovie[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watchlist state
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [filter, setFilter] = useState<WatchStatus | 'all'>('all');
  const [listLoading, setListLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<Stats | null>(null);

  // Modal
  const [editing, setEditing] = useState<WatchlistItem | null>(null);

  const watchlistImdbIds = useMemo(() => new Set(items.map((i) => i.imdb_id)), [items]);

  const refreshWatchlist = useCallback(async () => {
    setListLoading(true);
    try {
      const { items } = await api.listWatchlist();
      setItems(items);
    } catch {
      /* ignore */
    } finally {
      setListLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setStats(await api.stats());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshWatchlist();
    void refreshStats();
  }, [refreshWatchlist, refreshStats]);

  // Debounced search
  const runSearch = useCallback(async (q: string, page = 1) => {
    if (!q.trim()) {
      setResults([]);
      setSearchError(null);
      setSearchTotal(0);
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const res = await api.search(q, page);
      setResults(res.movies);
      setSearchTotal(res.total);
      setSearchPage(page);
      setUsingFallback(res.using_fallback);
      if (res.error && res.movies.length === 0) setSearchError(res.error);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void runSearch(query, 1), 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, runSearch]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  async function handleAdded() {
    await Promise.all([refreshWatchlist(), refreshStats()]);
  }

  async function handleRemove(item: WatchlistItem) {
    if (!confirm(`Remove "${item.title}" from your watchlist?`)) return;
    try {
      await api.removeItem(item.id);
      await Promise.all([refreshWatchlist(), refreshStats()]);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to remove');
    }
  }

  function handleSaved(updated: WatchlistItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    void refreshStats();
  }

  const totalPages = Math.ceil(searchTotal / 10);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{'\u{1F3AC}'}</span>
            <h1 className="text-lg font-bold tracking-tight">Movie Watchlist</h1>
          </div>
          <nav className="ml-auto flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            {(['search', 'watchlist', 'stats'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  view === v
                    ? 'bg-[var(--color-accent)] text-black'
                    : 'text-slate-300 hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {v === 'watchlist' ? `Watchlist (${items.length})` : v}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === 'search' && (
          <section>
            <div className="relative mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a movie…"
                autoFocus
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-11 pr-4 text-base text-slate-100 outline-none focus:border-amber-500/50"
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                {'\u{1F50D}'}
              </span>
              {searching && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  searching…
                </span>
              )}
            </div>

            {usingFallback && query.trim() && (
              <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                No <code>OMDB_API_KEY</code> set — showing built-in demo catalog. Set a key in your
                <code> .env</code> to search all of OMDb.
              </p>
            )}
            {searchError && (
              <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {searchError}
              </p>
            )}

            {query.trim() && !searching && results.length === 0 && !searchError && (
              <p className="py-12 text-center text-sm text-slate-500">No movies found.</p>
            )}

            {results.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {results.map((m) => (
                    <SearchResultCard
                      key={m.imdbID}
                      movie={m}
                      disabled={watchlistImdbIds.has(m.imdbID)}
                      disabledReason="Already in your watchlist"
                      onAdded={handleAdded}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={searchPage <= 1}
                      onClick={() => void runSearch(query, searchPage - 1)}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="text-sm text-slate-400">
                      Page {searchPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={searchPage >= totalPages}
                      onClick={() => void runSearch(query, searchPage + 1)}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}

            {!query.trim() && (
              <div className="py-16 text-center">
                <p className="text-sm text-slate-500">
                  Start typing to search for movies and add them to your watchlist.
                </p>
              </div>
            )}
          </section>
        )}

        {view === 'watchlist' && (
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-surface-2)]'
                }`}
              >
                All ({items.length})
              </button>
              {STATUS_LIST.map((s) => {
                const count = items.filter((i) => i.status === s).length;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter(s)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      filter === s
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    {STATUS_LABELS[s]} ({count})
                  </button>
                );
              })}
            </div>

            {listLoading && items.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-500">Loading…</p>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-slate-500">
                  {items.length === 0
                    ? 'Your watchlist is empty. Search and add some movies!'
                    : 'No entries for this filter.'}
                </p>
                {items.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setView('search')}
                    className="mt-4 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300"
                  >
                    Go to search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredItems.map((item) => (
                  <WatchlistCard
                    key={item.id}
                    item={item}
                    onEdit={(i) => setEditing(i)}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'stats' && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Your watchlist at a glance
            </h2>
            <StatsBar stats={stats} />
            {stats && stats.summary.total === 0 && (
              <p className="mt-8 text-center text-sm text-slate-500">
                Add movies to your watchlist to see stats here.
              </p>
            )}
          </section>
        )}
      </main>

      {editing && (
        <EditModal item={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-600">
        Movie Watchlist · data from OMDb · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
