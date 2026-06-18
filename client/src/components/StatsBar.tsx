import type { Stats } from '../types.js';

interface Props {
  stats: Stats | null;
}

export function StatsBar({ stats }: Props) {
  if (!stats) return null;
  const s = stats.summary;
  const maxGenre = stats.genres.reduce((m, g) => Math.max(m, g.count), 0) || 1;

  const tiles = [
    { label: 'Total', value: s.total, color: 'text-slate-100' },
    { label: 'Watched', value: s.watched, color: 'text-emerald-400' },
    { label: 'Watching', value: s.watching, color: 'text-amber-400' },
    { label: 'Want', value: s.want, color: 'text-sky-400' },
    { label: 'Avg rating', value: s.avg_rating ? `${s.avg_rating}/5` : '—', color: 'text-rose-400' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className={`text-2xl font-bold ${t.color}`}>{t.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">{t.label}</div>
          </div>
        ))}
      </div>

      {stats.genres.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Top genres (watched)
          </h3>
          <div className="space-y-2">
            {stats.genres.slice(0, 6).map((g) => (
              <div key={g.name} className="flex items-center gap-2">
                <span className="w-28 shrink-0 truncate text-xs text-slate-300">{g.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                    style={{ width: `${(g.count / maxGenre) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-slate-400">{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
