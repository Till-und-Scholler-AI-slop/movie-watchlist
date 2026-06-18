import { useState } from 'react';
import type { SearchTitle } from '../types.js';
import { api } from '../api.js';
import { Poster } from './Poster.js';
import { MediaTypeBadge } from './MediaTypeBadge.js';

interface Props {
  title: SearchTitle;
  disabled?: boolean;
  disabledReason?: string;
  onAdded: () => void;
}

export function SearchResultCard({ title, disabled, disabledReason, onAdded }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      await api.addTitle(title.tmdb_id, title.media_type);
      setDone(true);
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setBusy(false);
    }
  }

  const showOriginal =
    title.title_original &&
    title.title_original !== title.title_de &&
    title.title_original.length > 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Poster src={title.poster_url} alt={title.title_de} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute left-2 top-2">
          <MediaTypeBadge mediaType={title.media_type} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight" title={title.title_de}>
          {title.title_de}
        </h3>
        {showOriginal && (
          <p className="line-clamp-1 text-xs italic text-slate-500" title={title.title_original}>
            {title.title_original}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{title.year}</span>
          {title.vote_average > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="text-amber-400">{'\u2605'}</span>
              {title.vote_average.toFixed(1)}
            </span>
          )}
        </div>

        {done ? (
          <span className="mt-auto inline-flex items-center justify-center rounded-md bg-emerald-500/15 px-2 py-1.5 text-xs font-medium text-emerald-300">
            Added to watchlist
          </span>
        ) : (
          <button
            type="button"
            onClick={add}
            disabled={busy || disabled}
            title={disabled ? disabledReason : undefined}
            className="mt-auto inline-flex items-center justify-center rounded-md bg-[var(--color-accent)] px-2 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Adding…' : '+ Add'}
          </button>
        )}
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    </div>
  );
}
