import type { WatchStatus } from '../types.js';

const STYLES: Record<WatchStatus, { label: string; cls: string }> = {
  want: { label: 'Want to watch', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  watching: { label: 'Watching', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  watched: { label: 'Watched', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
};

export function StatusBadge({ status }: { status: WatchStatus }) {
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

export const STATUS_LIST: WatchStatus[] = ['want', 'watching', 'watched'];

export const STATUS_LABELS: Record<WatchStatus, string> = {
  want: 'Want to watch',
  watching: 'Watching',
  watched: 'Watched',
};
