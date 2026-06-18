import { useState } from 'react';

interface StarsProps {
  value: number | null;
  onChange?: (v: number | null) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' } as const;

export function Stars({ value, onChange, size = 'md' }: StarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = Boolean(onChange);
  const display = hover ?? value ?? 0;

  return (
    <div className={`inline-flex items-center gap-0.5 ${sizeMap[size]}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={`leading-none transition-transform ${
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          } ${n <= display ? 'text-amber-400' : 'text-slate-600'}`}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(null)}
          onClick={(e) => {
            e.stopPropagation();
            if (!interactive) return;
            onChange?.(value === n ? null : n);
          }}
        >
          {'\u2605'}
        </button>
      ))}
    </div>
  );
}
