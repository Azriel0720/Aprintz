import { Star } from 'lucide-react';

export default function ProductReviewBadge({
  average,
  count,
  compact = false,
}: {
  average: number;
  count: number;
  compact?: boolean;
}) {
  const roundedRating = Math.round(average);

  return (
    <span className={`flex items-center gap-1.5 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      <span className="flex items-center gap-0.5" aria-label={count ? `Rating ${average.toFixed(1)} dari 5` : 'Belum ada ulasan'}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            size={compact ? 12 : 14}
            fill={count && index < roundedRating ? 'currentColor' : 'none'}
            className={count && index < roundedRating ? 'text-amber-500' : 'text-slate-300'}
          />
        ))}
      </span>
      {count
        ? <span className="whitespace-nowrap text-slate-500">{average.toFixed(1)} <span className="text-slate-300">|</span> {count} ulasan</span>
        : <span className="whitespace-nowrap text-slate-400">Belum ada ulasan</span>}
    </span>
  );
}
