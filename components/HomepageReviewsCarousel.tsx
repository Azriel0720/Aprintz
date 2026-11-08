'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { HomepageReview } from '@/lib/homepage';

export default function HomepageReviewsCarousel({ reviews }: { reviews: HomepageReview[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  function move(direction: number) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(280, rail.clientWidth * 0.8), behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div className="mb-3 flex justify-end gap-2">
        <button type="button" onClick={() => move(-1)} aria-label="Ulasan sebelumnya" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-[#12345b] shadow-sm hover:border-blue-300 hover:text-brand-700"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => move(1)} aria-label="Ulasan berikutnya" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-[#12345b] shadow-sm hover:border-blue-300 hover:text-brand-700"><ChevronRight size={18} /></button>
      </div>
      <div ref={railRef} tabIndex={0} aria-label="Ulasan pelanggan, geser untuk melihat ulasan lainnya" className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {reviews.map(review => (
          <article key={review.id} className="w-[min(85vw,360px)] shrink-0 snap-start overflow-hidden rounded-lg border border-slate-200 bg-white sm:w-[340px]">
            <div className="p-4">
              <div className="flex items-center gap-1 text-amber-500" aria-label={`Rating ${review.rating} dari 5`}>{Array.from({ length: review.rating }, (_, index) => <Star key={index} size={15} fill="currentColor" />)}</div>
              <p className="mt-3 line-clamp-4 min-h-24 text-sm leading-6 text-slate-700">“{review.content}”</p>
              <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3"><div><b className="text-sm text-[#12345b]">{review.customer_name}</b><p className="mt-0.5 text-xs text-slate-500">Pelanggan terverifikasi</p></div><Link href={`/produk/${review.product_slug}#ulasan-produk`} className="text-right text-xs font-bold text-brand-700 hover:underline">{review.company}</Link></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
