'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

type ProductGalleryProps = {
  name: string;
  images: { id: string; url: string; alt: string }[];
};

export default function ProductGallery({ name, images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentImage = images[activeIndex];

  function move(direction: number) {
    setActiveIndex(index => (index + direction + images.length) % images.length);
  }

  return (
    <div>
      <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:min-h-[440px]">
        {currentImage ? (
          <img src={currentImage.url} alt={currentImage.alt || name} className="h-full max-h-[560px] w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-slate-400"><ImageIcon size={34} /><span>Foto produk belum tersedia</span></div>
        )}
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => move(-1)} aria-label="Foto sebelumnya" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#12345b] shadow"><ChevronLeft size={20} /></button>
            <button type="button" onClick={() => move(1)} aria-label="Foto berikutnya" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#12345b] shadow"><ChevronRight size={20} /></button>
            <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700">{activeIndex + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button key={image.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`Tampilkan foto ${index + 1}`} aria-pressed={activeIndex === index} className={`shrink-0 overflow-hidden rounded-md border-2 ${activeIndex === index ? 'border-brand-600' : 'border-transparent'}`}>
              <img src={image.url} alt={image.alt || `${name} foto ${index + 1}`} className="h-16 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
