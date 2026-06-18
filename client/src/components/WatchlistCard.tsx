import type { WatchlistItem } from '../types.js';
import { Poster } from './Poster.js';
import { Stars } from './Stars.js';
import { StatusBadge } from './StatusBadge.js';

interface Props {
  item: WatchlistItem;
  onEdit: (item: WatchlistItem) => void;
  onRemove: (item: WatchlistItem) => void;
}

export function WatchlistCard({ item, onEdit, onRemove }: Props) {
  return (
    <div className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:border-amber-500/40">
      <div className="h-36 w-24 shrink-0 overflow-hidden rounded-md">
        <Poster src={item.poster} alt={item.title} className="h-full w-full" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold" title={item.title}>
            {item.title}
          </h3>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {item.year && <span>{item.year}</span>}
          {item.runtime && <span>{item.runtime}</span>}
          {item.imdb_rating && item.imdb_rating !== 'N/A' && (
            <span className="inline-flex items-center gap-1">
              <span className="text-amber-400">{'\u2605'}</span>
              {item.imdb_rating}
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
