import { useEffect, useState } from 'react';
import type { WatchlistItem, WatchStatus } from '../types.js';
import { STATUS_LIST, STATUS_LABELS } from './StatusBadge.js';
import { MediaTypeBadge } from './MediaTypeBadge.js';
import { Stars } from './Stars.js';
import { api } from '../api.js';

interface Props {
  item: WatchlistItem;
  onClose: () => void;
  onSaved: (item: WatchlistItem) => void;
}

function formatShowInfo(item: WatchlistItem): string | null {
  const seasons = item.number_of_seasons;
  const episodes = item.number_of_episodes;
  if (!seasons && !episodes) return null;
  const parts: string[] = [];
  if (seasons) parts.push(`${seasons} Staffel${seasons !== 1 ? 'n' : ''}`);
  if (episodes) parts.push(`${episodes} Episode${episodes !== 1 ? 'n' : ''}`);
  return parts.join(' · ');
}

export function EditModal({ item, onClose, onSaved }: Props) {
  const [status, setStatus] = useState<WatchStatus>(item.status);
  const [rating, setRating] = useState<number | null>(item.rating);
  const [notes, setNotes] = useState<string>(item.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const { item: updated } = await api.updateItem(item.id, {
        status,
        rating,
        notes: notes.trim() || null,
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const showOriginal =
    item.original_title &&
    item.original_title !== item.title &&
    item.original_title.length > 0;

  const showInfo = item.media_type === 'tv' ? formatShowInfo(item) : null;
  const notesPlaceholder =
    item.media_type === 'tv' ? 'Was denkst du über die Serie?' : 'Was denkst du über den Film?';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0">
            <div className="mb-1">
              <MediaTypeBadge mediaType={item.media_type} />
            </div>
            <h2 className="truncate text-lg font-semibold" title={item.title}>{item.title}</h2>
            {showOriginal && (
              <p className="truncate text-xs italic text-slate-500" title={item.original_title ?? undefined}>
                {item.original_title}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              {item.year}
              {showInfo ? ` · ${showInfo}` : ''}
              {item.director ? ` · ${item.director}` : ''}
            </p>
            {item.tagline && (
              <p className="mt-1 text-xs italic text-slate-500">&ldquo;{item.tagline}&rdquo;</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-[var(--color-surface-2)] hover:text-slate-200"
            aria-label="Close"
          >
            {'\u2715'}
          </button>
        </div>

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
                      : 'border-[var(--color-border)] text-slate-300 hover:bg-[var(--color-surface-2)]'
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
              placeholder={notesPlaceholder}
              className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3 text-sm text-slate-100 outline-none focus:border-amber-500/50"
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-[var(--color-surface-2)]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-300 disabled:opacity-50"
          >
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
