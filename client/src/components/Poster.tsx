interface PosterProps {
  src: string | null;
  alt: string;
  className?: string;
}

export function Poster({ src, alt, className = '' }: PosterProps) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-800 text-slate-500 ${className}`}
        aria-label={alt}
      >
        <span className="text-3xl">{'\u{1F3AC}'}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}
