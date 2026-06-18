import type { MediaType } from '../types.js';

interface Props {
  mediaType: MediaType;
  className?: string;
}

const STYLES: Record<MediaType, { label: string; cls: string }> = {
  movie: { label: 'Film', cls: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  tv: { label: 'Serie', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
};

export function MediaTypeBadge({ mediaType, className = '' }: Props) {
  const s = STYLES[mediaType];
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.cls} ${className}`}
    >
      {s.label}
    </span>
  );
}
