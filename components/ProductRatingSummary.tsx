'use client';

import { useEffect, useState } from 'react';
import { Star, StarHalf } from 'lucide-react';

type Props = { productSlug: string };

export default function ProductRatingSummary({ productSlug }: Props) {
  const [summary, setSummary] = useState<{ average: number; count: number } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/products/${encodeURIComponent(productSlug)}/reviews`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Rating gagal dimuat.');
        return data as { average: number; count: number };
      })
      .then(data => {
        if (active) setSummary(data);
      })
      .catch(error => {
        console.error('Failed to load product rating:', error);
      });
    return () => {
      active = false;
    };
  }, [productSlug]);

  const average = summary?.average ?? 0;
  const wholeStars = Math.floor(average);
  const hasHalfStar = average - wholeStars >= 0.5;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm" aria-label={summary ? `Rating ${average.toFixed(1)} dari 5, ${summary.count} ulasan` : 'Memuat rating produk'}>
      <span className="flex items-center gap-0.5 text-amber-500" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => {
          if (index < wholeStars) return <Star key={index} size={17} fill="currentColor" />;
          if (index === wholeStars && hasHalfStar) return <StarHalf key={index} size={17} fill="currentColor" />;
          return <Star key={index} size={17} className="text-slate-300" />;
        })}
      </span>
      {summary ? (
        <span className="text-slate-600">
          {summary.count ? <><b className="text-[#12345b]">{average.toFixed(1)}</b> | {summary.count} ulasan</> : 'Belum ada ulasan'}
        </span>
      ) : <span className="text-slate-400">Memuat rating...</span>}
    </div>
  );
}
