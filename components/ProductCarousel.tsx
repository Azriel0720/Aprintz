'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, PackageCheck } from 'lucide-react';
import { formatIDR } from '@/lib/products';
import type { CatalogProduct } from '@/lib/catalog';
import ProductReviewBadge from '@/components/ProductReviewBadge';

export default function ProductCarousel({ products }: { products: CatalogProduct[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  function move(direction: number) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(240, rail.clientWidth * 0.78), behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div className="mb-3 flex justify-end gap-2">
        <button type="button" onClick={() => move(-1)} aria-label="Produk sebelumnya" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-[#12345b] shadow-sm hover:border-blue-300 hover:text-brand-700"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => move(1)} aria-label="Produk berikutnya" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-[#12345b] shadow-sm hover:border-blue-300 hover:text-brand-700"><ChevronRight size={18} /></button>
      </div>
      <div ref={railRef} tabIndex={0} aria-label="Produk pilihan, geser untuk melihat produk lainnya" className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map(product => (
          <article key={product.id} className="w-56 shrink-0 snap-start overflow-hidden rounded-lg border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:w-60">
            <Link href={`/produk/${product.slug}`} className="group flex h-full flex-col">
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
                {product.imageUrl
                  ? <img src={product.imageUrl} alt={product.imageAlt} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
                  : <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,#e5effb,#f9fbfe)] text-brand-700"><PackageCheck size={34} /><span className="px-3 text-center text-xs font-semibold">APRINTZ · {product.category}</span></div>}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">{product.category}</p>
                <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#12345b] group-hover:text-blue-700">{product.name}</h3>
                <ProductReviewBadge average={product.ratingAverage} count={product.reviewCount} compact />
                <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-slate-500">{product.description}</p>
                <p className="mt-auto rounded-md border-l-[3px] border-brand-600 bg-blue-50 px-3 py-2.5 text-sm font-black text-brand-700">Mulai {formatIDR(product.price)} <span className="font-medium text-slate-500">/ {product.unit}</span></p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}