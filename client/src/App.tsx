import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SearchTitle, WatchlistItem, WatchStatus, MediaType, Stats, Me } from './types.js';
import { api } from './api.js';
import { SearchResultCard } from './components/SearchResultCard.js';
import { WatchlistCard } from './components/WatchlistCard.js';
import { TitleDetailOverlay } from './components/TitleDetailOverlay.js';
import { StatsBar } from './components/StatsBar.js';
import { FollowsTab } from './components/FollowsTab.js';
import { STATUS_LIST, STATUS_LABELS } from './components/StatusBadge.js';

type View = 'search' | 'watchlist' | 'stats' | 'follows';
type MediaFilter = 'all' | MediaType;
type SortMode = 'added' | 'title' | 'year' | 'rating' | 'tmdb';

interface StackItem {
  tmdb_id: number;
  media_type: MediaType;
}

const SORT_LABELS: Record<SortMode, string> = {
  added: 'Zuletzt hinzugefügt',
  title: 'Titel (A–Z)',
  year: 'Jahr',
  rating: 'Deine Bewertung',
  tmdb: 'TMDB-Rating',
};

// --- URL hash sync (refresh-/share-safe) ---

interface HashState {
  view: View;
  status: WatchStatus | 'all';
  media: MediaFilter;
  sort: SortMode;
  q: string;
  list: string;
}

const DEFAULT_HASH: HashState = {
  view: 'search',
  status: 'all',
  media: 'all',
  sort: 'added',
  q: '',
  list: '',
};

function parseHash(): Partial<HashState> {
  const h = window.location.hash.replace(/^#/, '');
  if (!h) return {};
  const params = new URLSearchParams(h);
  const out: Partial<HashState> = {};
  const v = params.get('view');
  if (v === 'search' || v === 'watchlist' || v === 'stats' || v === 'follows') out.view = v;
  const s = params.get('status');
  if (s === 'all' || s === 'want' || s === 'watching' || s === 'watched') out.status = s;
  const m = params.get('media');
  if (m === 'all' || m === 'movie' || m === 'tv') out.media = m;
  const so = params.get('sort');
  if (so === 'added' || so === 'title' || so === 'year' || so === 'rating' || so === 'tmdb') out.sort = so;
  const q = params.get('q');
  if (q !== null) out.q = q;
  const l = params.get('list');
  if (l !== null) out.list = l;
  return out;
}

function writeHash(state: HashState) {
  const params = new URLSearchParams();
  params.set('view', state.view);
  params.set('status', state.status);
  params.set('media', state.media);
  params.set('sort', state.sort);
  params.set('q', state.q);
  params.set('list', state.list);
  const next = '#' + params.toString();
  if (next !== window.location.hash) {
    window.history.replaceState(null, '', next);
  }
}

export function App() {
  const initial = useMemo(() => ({ ...DEFAULT_HASH, ...parseHash() }), []);
  const [view, setView] = useState<View>(initial.view);
  const [statusFilter, setStatusFilter] = useState<WatchStatus | 'all'>(initial.status);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>(initial.media);
  const [sortMode, setSortMode] = useState<SortMode>(initial.sort);
  const [listFilter, setListFilter] = useState<string>(initial.list);

  // Search state
  const [query, setQuery] = useState<string>(initial.q);
  const [results, setResults] = useState<SearchTitle[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watchlist state
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<Stats | null>(null);

  // Detail overlay
  const [detailStack, setDetailStack] = useState<StackItem[]>([]);

  // Current user (for the badge + logout link)
  const [me, setMe] = useState<Me | null>(null);

  const watchlistKeys = useMemo(
    () => new Set(items.map((i) => `${i.tmdb_id}-${i.media_type}`)),
    [items],
  );

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
    void api.me().then(setMe).catch(() => setMe(null));
  }, [refreshWatchlist, refreshStats]);

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
      setResults(res.titles);
      setSearchTotal(res.total);
      setSearchPage(page);
      setUsingFallback(res.using_fallback);
      if (res.error && res.titles.length === 0) setSearchError(res.error);
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

  // Keep URL hash in sync with filters/view/sort (refresh-/share-safe).
  useEffect(() => {
    writeHash({ view, status: statusFilter, media: mediaFilter, sort: sortMode, q: query, list: listFilter });
  }, [view, statusFilter, mediaFilter, sortMode, query, listFilter]);

  // React to browser back/forward (e.g. user edits hash manually).
  useEffect(() => {
    const onPop = () => {
      const p = { ...DEFAULT_HASH, ...parseHash() };
      setView(p.view);
      setStatusFilter(p.status);
      setMediaFilter(p.media);
      setSortMode(p.sort);
      setListFilter(p.list);
      if (p.q !== undefined) setQuery(p.q);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const filteredAndSorted = useMemo(() => {
    let arr = items.filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (mediaFilter !== 'all' && i.media_type !== mediaFilter) return false;
      if (listFilter.trim()) {
        const q = listFilter.trim().toLowerCase();
        const hay = `${i.title} ${i.original_title ?? ''} ${i.genre ?? ''} ${i.director ?? ''} ${i.notes ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const dir: 1 | -1 = 1;
    arr = arr.sort((a, b) => {
      switch (sortMode) {
        case 'title':
          return a.title.localeCompare(b.title, 'de', { sensitivity: 'base' });
        case 'year': {
          const ay = a.year ? Number(a.year) : 0;
          const by = b.year ? Number(b.year) : 0;
          return by - ay;
        }
        case 'rating': {
          const ar = a.rating ?? 0;
          const br = b.rating ?? 0;
          return br - ar;
        }
        case 'tmdb': {
          const ar = a.tmdb_rating ?? 0;
          const br = b.tmdb_rating ?? 0;
          return br - ar;
        }
        case 'added':
        default:
          return (b.added_at || '').localeCompare(a.added_at || '');
      }
    });
    void dir;
    return arr;
  }, [items, statusFilter, mediaFilter, sortMode, listFilter]);

  const totalPages = Math.ceil(searchTotal / 10);

  const counts = useMemo(() => {
    const all = items.length;
    const movies = items.filter((i) => i.media_type === 'movie').length;
    const shows = items.filter((i) => i.media_type === 'tv').length;
    const byStatus: Record<WatchStatus, number> = { want: 0, watching: 0, watched: 0 };
    for (const i of items) byStatus[i.status]++;
    return { all, movies, shows, byStatus };
  }, [items]);

  async function handleUpdated() {
    await Promise.all([refreshWatchlist(), refreshStats()]);
  }

  async function handleRemove(item: WatchlistItem) {
    const noun = item.media_type === 'tv' ? 'Serie' : 'Film';
    if (!confirm(`„${item.title}" (${noun}) aus deiner Watchlist entfernen?`)) return;
    try {
      await api.removeItem(item.id);
      await Promise.all([refreshWatchlist(), refreshStats()]);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to remove');
    }
  }

  function openDetail(item: WatchlistItem) {
    setDetailStack([{ tmdb_id: item.tmdb_id, media_type: item.media_type }]);
  }

  function openDetailFromSearch(title: SearchTitle) {
    setDetailStack([{ tmdb_id: title.tmdb_id, media_type: title.media_type }]);
  }

  function pushDetail(item: StackItem) {
    setDetailStack((prev) => [...prev, item]);
  }

  function popDetail() {
    setDetailStack((prev) => prev.slice(0, -1));
  }

  function closeDetail() {
    setDetailStack([]);
  }

  async function handleOverlayChanged() {
    await Promise.all([refreshWatchlist(), refreshStats()]);
  }

  // C: Random pick — choose a random "want" item from current filtered set
  // (falls back to any filtered item if none are "want"). Opens detail.
  function pickRandom() {
    const pool = filteredAndSorted.filter((i) => i.status === 'want');
    const source = pool.length > 0 ? pool : filteredAndSorted;
    if (source.length === 0) return;
    const pick = source[Math.floor(Math.random() * source.length)];
    openDetail(pick);
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{'\u{1F3AC}'}</span>
            <h1 className="text-lg font-bold tracking-tight">Movie Watchlist</h1>
          </div>
          <nav className="ml-auto flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            {(['search', 'watchlist', 'stats', 'follows'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === v
                    ? 'bg-[var(--color-accent)] text-black'
                    : 'text-slate-300 hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {v === 'watchlist'
                  ? `Watchlist (${items.length})`
                  : v === 'stats'
                    ? 'Stats'
                    : v === 'follows'
                      ? 'Freunde'
                      : 'Suche'}
              </button>
            ))}
          </nav>
          {me && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden sm:inline">Angemeldet als {me.name || me.username || me.uid}</span>
              {me.uid !== 'dev' && (
                <a
                  href={`https://auth.sscholler.de/if/flow/default-invalidation-flow/?rd=${encodeURIComponent(window.location.origin + '/')}`}
                  className="rounded-md border border-[var(--color-border)] px-2 py-1 text-slate-300 hover:bg-[var(--color-surface-2)]"
                >
                  Abmelden
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === 'search' && (
          <section>
            <div className="relative mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Film oder Serie suchen … (deutsch oder englisch)"
                autoFocus
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-11 pr-4 text-base text-slate-100 outline-none focus:border-amber-500/50"
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                {'\u{1F50D}'}
              </span>
              {searching && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  suche…
                </span>
              )}
            </div>

            {usingFallback && query.trim() && (
              <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                Kein <code>TMDB_API_KEY</code> gesetzt — eingeschränkter Demo-Katalog aktiv.
                Setze einen Key in deiner <code>.env</code> für die volle TMDB-Datenbank
                (Filme + Serien).
              </p>
            )}
            {searchError && (
              <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {searchError}
              </p>
            )}

            {query.trim() && !searching && results.length === 0 && !searchError && (
              <p className="py-12 text-center text-sm text-slate-500">Keine Treffer.</p>
            )}

            {results.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {results.map((t) => (
                    <SearchResultCard
                      key={`${t.tmdb_id}-${t.media_type}`}
                      title={t}
                      disabled={watchlistKeys.has(`${t.tmdb_id}-${t.media_type}`)}
                      disabledReason="Bereits in deiner Watchlist"
                      onAdded={handleUpdated}
                      onOpen={openDetailFromSearch}
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
                      Zurück
                    </button>
                    <span className="text-sm text-slate-400">
                      Seite {searchPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={searchPage >= totalPages}
                      onClick={() => void runSearch(query, searchPage + 1)}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                      Weiter
                    </button>
                  </div>
                )}
              </>
            )}

            {!query.trim() && (
              <div className="py-16 text-center">
                <p className="text-sm text-slate-500">
                  Tippe einen Titel ein, um Filme und Serien zu suchen und zur Watchlist
                  hinzuzufügen. Deutsch und Englisch gleichzeitig.
                </p>
              </div>
            )}
          </section>
        )}

        {view === 'watchlist' && (
          <section>
            <div className="mb-4 space-y-3">
              {/* Top row: filters + random button */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaFilter('all')}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      mediaFilter === 'all'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    Alle ({counts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaFilter('movie')}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      mediaFilter === 'movie'
                        ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                        : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    Filme ({counts.movies})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaFilter('tv')}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      mediaFilter === 'tv'
                        ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                        : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    Serien ({counts.shows})
                  </button>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={pickRandom}
                    disabled={filteredAndSorted.length === 0}
                    title="Zufälligen Titel aus deiner Liste öffnen"
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-amber-500/40 hover:bg-[var(--color-surface-2)] disabled:opacity-40"
                  >
                    {'\u{1F3B2}'} Was soll ich schauen?
                  </button>
                </div>
              </div>

              {/* Status filter row */}
              <div className="flex flex-wrap items-center gap-2 border-l-2 border-[var(--color-border)] pl-3">
                <span className="text-xs uppercase tracking-wide text-slate-500">Status:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                      : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  Alle
                </button>
                {STATUS_LIST.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      statusFilter === s
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    {STATUS_LABELS[s]} ({counts.byStatus[s]})
                  </button>
                ))}
              </div>

              {/* Sort + in-list search row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-500">Sortieren:</span>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-2 pr-7 text-xs text-slate-100 outline-none focus:border-amber-500/50"
                  >
                    {(Object.keys(SORT_LABELS) as SortMode[]).map((m) => (
                      <option key={m} value={m}>{SORT_LABELS[m]}</option>
                    ))}
                  </select>
                </div>
                <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
                  <input
                    value={listFilter}
                    onChange={(e) => setListFilter(e.target.value)}
                    placeholder="In der Liste suchen …"
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-8 pr-3 text-xs text-slate-100 outline-none focus:border-amber-500/50"
                  />
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                    {'\u{1F50D}'}
                  </span>
                  {listFilter && (
                    <button
                      type="button"
                      onClick={() => setListFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-200"
                      aria-label="Filter zurücksetzen"
                    >
                      {'\u2715'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {listLoading && items.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-500">Laden…</p>
            ) : filteredAndSorted.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-slate-500">
                  {items.length === 0
                    ? 'Deine Watchlist ist leer. Suche und füge Titel hinzu!'
                    : 'Keine Einträge für diesen Filter.'}
                </p>
                {items.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setView('search')}
                    className="mt-4 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300"
                  >
                    Zur Suche
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredAndSorted.map((item) => (
                  <WatchlistCard
                    key={item.id}
                    item={item}
                    onOpen={openDetail}
                    onRemove={handleRemove}
                    onUpdated={handleUpdated}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'stats' && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Deine Watchlist auf einen Blick
            </h2>
            <StatsBar stats={stats} />
            {stats && stats.summary.total === 0 && (
              <p className="mt-8 text-center text-sm text-slate-500">
                Füge Titel zu deiner Watchlist hinzu, um hier Statistiken zu sehen.
              </p>
            )}
          </section>
        )}

        {view === 'follows' && <FollowsTab />}
      </main>

      {detailStack.length > 0 && (
        <TitleDetailOverlay
          stack={detailStack}
          onClose={closeDetail}
          onChanged={handleOverlayChanged}
          onPop={popDetail}
          onPush={pushDetail}
        />
      )}

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-600">
        Movie Watchlist · Daten von TMDB · Filme & Serien · {new Date().getFullYear()}
      </footer>
    </div>
  );
}