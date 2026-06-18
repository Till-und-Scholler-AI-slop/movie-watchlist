import type { WatchlistItem } from '../types.js';
import { api, posterUrlFromPath } from '../api.js';
import { Poster } from './Poster.js';
import { Stars } from './Stars.js';
import { StatusBadge } from './StatusBadge.js';

interface Props {
  item: WatchlistItem;
  onEdit: (item: WatchlistItem) => void;
  onRemove: (item: WatchlistItem) => void;
}

function formatRuntime(min: number | null): string | null {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function WatchlistCard({ item, onEdit, onRemove }: Props) {
  const poster = posterUrlFromPath(item.poster_path);
  const showOriginal =
    item.original_title &&
    item.original_title !== item.title &&
    item.original_title.length > 0;

  return (
    <div className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:border-amber-500/40">
      <div className="h-36 w-24 shrink-0 overflow-hidden rounded-md">
        <Poster src={poster} alt={item.title} className="h-full w-full" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold" title={item.title}>
              {item.title}
            </h3>
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
          {formatRuntime(item.runtime) && <span>{formatRuntime(item.runtime)}</span>}
          {item.tmdb_rating !== null && item.tmdb_rating > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="text-amber-400">{'\u2605'}</span>
              {item.tmdb_rating.toFixed(1)}
            </span>
          )}
        </div>

        {item.genre && (
          <p className="line-clamp-1 text-xs text-slate-500">{item.genre}</p>
        )}

        {item.plot && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{item.plot}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Stars value={item.rating} size="sm" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-[var(--color-surface-2)]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/10"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
