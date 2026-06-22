import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MediaType, TitleFull, WatchStatus } from '../types.js';
import { api } from '../api.js';
import { Poster } from './Poster.js';
import { Stars } from './Stars.js';
import { StatusBadge } from './StatusBadge.js';
import { MediaTypeBadge } from './MediaTypeBadge.js';
import { STATUS_LIST, STATUS_LABELS } from './StatusBadge.js';

interface StackItem {
  tmdb_id: number;
  media_type: MediaType;
}

interface Props {
  stack: StackItem[];
  onClose: () => void;
  onChanged: () => void;
  onPop: () => void;
  onPush: (item: StackItem) => void;
}

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

export function TitleDetailOverlay({ stack, onClose, onChanged, onPop, onPush }: Props) {
  const top = stack[stack.length - 1];

  const [data, setData] = useState<TitleFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [status, setStatus] = useState<WatchStatus>('want');
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [trailerPlaying, setTrailerPlaying] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (item: StackItem) => {
    setLoading(true);
    setLoadError(null);
    setData(null);
    setTrailerPlaying(false);
    setActionError(null);
    setStatus('want');
    setRating(null);
    setNotes('');
    try {
      const full = await api.getTitleFull(item.tmdb_id, item.media_type);
      if (!full) {
        setLoadError('Titel nicht gefunden');
        return;
      }
      setData(full);
      if (full.watchlist) {
        setStatus(full.watchlist.status);
        setRating(full.watchlist.rating);
        setNotes(full.watchlist.notes ?? '');
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!top) return;
    void load(top);
  }, [top, load]);

  useEffect(() => {
    if (stack.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [stack.length, onClose]);

  const inWatchlist = !!data?.watchlist;
  const isTv = data?.title.media_type === 'tv';
  const meta = useMemo(() => {
    if (!data) return null;
    const t = data.title;
    if (isTv) return formatShowInfo(t.number_of_seasons, t.number_of_episodes);
    return formatRuntime(t.runtime);
  }, [data, isTv]);

  async function save() {
    if (!data?.watchlist) return;
    setSaving(true);
    setActionError(null);
    try {
      await api.updateItem(data.watchlist.id, {
        status,
        rating,
        notes: notes.trim() || null,
      });
      onChanged();
      // Reload to reflect watched_at etc.
      if (top) await load(top);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  async function addToWatchlist() {
    if (!top) return;
    setAdding(true);
    setActionError(null);
    try {
      await api.addTitle(top.tmdb_id, top.media_type);
      onChanged();
      await load(top);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Fehler beim Hinzufügen');
    } finally {
      setAdding(false);
    }
  }

  async function remove() {
    if (!data?.watchlist) return;
    const noun = data.title.media_type === 'tv' ? 'Serie' : 'Film';
    if (!confirm(`„${data.title.title}" (${noun}) aus deiner Watchlist entfernen?`)) return;
    setRemoving(true);
    setActionError(null);
    try {
      await api.removeItem(data.watchlist.id);
      onChanged();
      onClose();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Fehler beim Entfernen');
    } finally {
      setRemoving(false);
    }
  }

  if (stack.length === 0) return null;

  const d = data?.title;
  const cast = data?.cast ?? [];
  const similar = data?.similar ?? [];
  const crew = data?.crew_top ?? [];
  const trailerKey = data?.trailer_key ?? null;
  const trailerName = data?.trailer_name ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative h-full w-full max-w-5xl overflow-y-auto bg-[var(--color-canvas)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        ref={scrollRef}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-canvas)]/85 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            {stack.length > 1 && (
              <button
                type="button"
                onClick={onPop}
                className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-slate-200 hover:bg-[var(--color-surface-2)]"
                title="Zurück"
              >
                ← Zurück
              </button>
            )}
            {d && (
              <div className="flex items-center gap-2">
                <MediaTypeBadge mediaType={d.media_type} />
                {inWatchlist && <StatusBadge status={data!.watchlist!.status} />}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-[var(--color-surface-2)] hover:text-slate-200"
            aria-label="Schließen"
          >
            {'\u2715'}
          </button>
        </div>

        {loading && (
          <div className="p-12 text-center text-sm text-slate-400">Lade Details…</div>
        )}

        {loadError && (
          <div className="p-12 text-center">
            <p className="text-sm text-rose-400">{loadError}</p>
          </div>
        )}

        {d && !loading && !loadError && (
          <>
            {/* Hero */}
            <section className="relative">
              {d.backdrop_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40"
                  style={{ backgroundImage: `url(${d.backdrop_url})` }}
                  aria-hidden
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-canvas)]/70 to-[var(--color-canvas)]" />
              <div className="relative flex flex-col gap-5 px-4 py-8 sm:flex-row sm:items-end sm:gap-6 sm:px-8 sm:py-12">
                <div className="h-56 w-40 shrink-0 overflow-hidden rounded-xl shadow-2xl sm:h-72 sm:w-52">
                  <Poster src={d.poster_url} alt={d.title} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{d.title}</h1>
                  {d.original_title && d.original_title !== d.title && (
                    <p className="mt-1 text-sm italic text-slate-400">{d.original_title}</p>
                  )}
                  {d.tagline && (
                    <p className="mt-2 text-sm italic text-slate-400">&ldquo;{d.tagline}&rdquo;</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                    {d.year && <span className="font-medium">{d.year}</span>}
                    {meta && <span>· {meta}</span>}
                    {d.tmdb_rating > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-amber-400">{'\u2605'}</span>
                        {d.tmdb_rating.toFixed(1)}
                      </span>
                    )}
                    {d.director && <span>· {d.director}</span>}
                    {d.imdb_id && (
                      <a
                        href={`https://www.imdb.com/title/${d.imdb_id}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-[var(--color-surface-2)]"
                      >
                        IMDb ↗
                      </a>
                    )}
                  </div>
                  {d.genre && (
                    <p className="mt-2 text-xs text-slate-400">{d.genre}</p>
                  )}
                  {d.plot && (
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
                      {d.plot}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <div className="space-y-10 px-4 pb-12 sm:px-8">
              {/* Cast */}
              {cast.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Besetzung
                  </h2>
                  <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
                    {cast.map((c) => (
                      <div key={c.id} className="flex w-24 shrink-0 flex-col items-center text-center">
                        <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-800 ring-1 ring-[var(--color-border)]">
                          {c.profile_url ? (
                            <img
                              src={c.profile_url}
                              alt={c.name}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl text-slate-600">
                              {'\u{1F464}'}
                            </div>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-200" title={c.name}>
                          {c.name}
                        </p>
                        {c.character && (
                          <p className="line-clamp-2 text-[10px] text-slate-500" title={c.character}>
                            {c.character}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Trailer */}
              {trailerKey && (
                <section>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Trailer
                  </h2>
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-black">
                    {trailerPlaying ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`}
                        title={trailerName ?? 'Trailer'}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTrailerPlaying(true)}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-200 transition-colors hover:bg-black/40"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black transition-transform hover:scale-110">
                          <span className="ml-1 text-2xl">▶</span>
                        </div>
                        {trailerName && (
                          <span className="text-sm font-medium">{trailerName}</span>
                        )}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Crew */}
              {crew.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Crew
                  </h2>
                  <ul className="grid gap-1 text-xs text-slate-300 sm:grid-cols-2">
                    {crew.map((c, i) => (
                      <li key={`${c.job}-${c.name}-${i}`} className="flex justify-between gap-2 border-b border-[var(--color-border)] py-1">
                        <span className="text-slate-500">{c.job}</span>
                        <span className="font-medium">{c.name}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Similar */}
              {similar.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ähnliche Titel
                  </h2>
                  <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
                    {similar.map((s) => (
                      <button
                        key={`${s.tmdb_id}-${s.media_type}`}
                        type="button"
                        onClick={() => onPush({ tmdb_id: s.tmdb_id, media_type: s.media_type })}
                        className="flex w-32 shrink-0 flex-col items-stretch overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-left transition-colors hover:border-amber-500/40"
                      >
                        <div className="aspect-[2/3] w-full overflow-hidden">
                          <Poster src={s.poster_url} alt={s.title_de} className="h-full w-full" />
                        </div>
                        <div className="p-2">
                          <p className="line-clamp-2 text-xs font-medium leading-tight" title={s.title_de}>
                            {s.title_de}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {s.year}
                            {s.vote_average > 0 && ` · ★ ${s.vote_average.toFixed(1)}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Edit / Add */}
              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {inWatchlist ? 'Deine Notizen' : 'Zur Watchlist'}
                </h2>

                {actionError && (
                  <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                    {actionError}
                  </p>
                )}

                {inWatchlist ? (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                        Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_LIST.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                              status === s
                                ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                                : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-canvas)]'
                            }`}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                        Deine Bewertung
                      </label>
                      <div className="flex items-center gap-3">
                        <Stars value={rating} onChange={setRating} size="lg" />
                        {rating !== null && (
                          <button
                            type="button"
                            onClick={() => setRating(null)}
                            className="text-xs text-slate-400 hover:text-slate-200"
                          >
                            clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                        Notizen
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder={
                          data?.title.media_type === 'tv'
                            ? 'Was denkst du über die Serie?'
                            : 'Was denkst du über den Film?'
                        }
                        className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3 text-sm text-slate-100 outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={remove}
                        disabled={removing || saving}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        {removing ? 'Entferne…' : 'Entfernen'}
                      </button>
                      <button
                        type="button"
                        onClick={save}
                        disabled={saving || removing}
                        className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-300 disabled:opacity-50"
                      >
                        {saving ? 'Speichern…' : 'Speichern'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={addToWatchlist}
                    disabled={adding}
                    className="w-full rounded-lg bg-[var(--color-accent)] py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-300 disabled:opacity-50"
                  >
                    {adding ? 'Wird hinzugefügt…' : '+ Zur Watchlist hinzufügen'}
                  </button>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}