'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flag,
  Gift,
  Image as ImageIcon,
  MapPin,
  Package,
  Printer,
  Shirt,
  Truck,
} from 'lucide-react';
import type { CatalogCategory, CatalogProduct } from '@/lib/catalog';
import type { HomepageBanner } from '@/lib/homepage';

type Props = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  banners: HomepageBanner[];
};

type HeroSlide = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  imageUrl?: string | null;
  imageAlt?: string;
  product?: CatalogProduct;
};

const categoryIcons = [FileText, Gift, CalendarDays, Flag, ImageIcon, Package, Camera, Shirt, Printer];

export default function HomeMarketplaceHero({ categories, products, banners }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const imageProduct = products.find(product => product.imageUrl);
  const featuredProducts = [imageProduct, ...products.filter(product => product.id !== imageProduct?.id)].filter((product): product is CatalogProduct => Boolean(product)).slice(0, 3);
  const fallbackSlides: HeroSlide[] = [
    {
      eyebrow: 'CETAKAN FAVORIT APRINTZ',
      title: featuredProducts[0] ? `${featuredProducts[0].name}, siap jadi pusat perhatian` : 'Buat ide cetakmu tampil lebih berkesan',
      description: featuredProducts[0]?.description || 'Pilihan cetak untuk kebutuhan promosi, bisnis, acara, dan hadiah custom.',
      href: featuredProducts[0] ? `/produk/${featuredProducts[0].slug}` : '/produk',
      action: 'Lihat produk',
      product: featuredProducts[0],
    },
    {
      eyebrow: 'UNTUK BISNIS & BRAND',
      title: featuredProducts[1] ? `Perlengkapan ${featuredProducts[1].name} untuk usahamu` : 'Dari identitas brand sampai kebutuhan promosi',
      description: 'Pilih bahan, ukuran, dan jumlah. Tim APRINTZ bantu cek spesifikasi sebelum produksi.',
      href: featuredProducts[1] ? `/produk/${featuredProducts[1].slug}` : '/produk',
      action: 'Jelajahi katalog',
      product: featuredProducts[1],
    },
    {
      eyebrow: 'CUSTOM ORDER',
      title: featuredProducts[2] ? `Wujudkan ${featuredProducts[2].name} versi kamu` : 'Punya kebutuhan cetak yang unik?',
      description: 'Kirim desain dan konsultasikan kebutuhan khusus langsung bersama CS APRINTZ.',
      href: 'https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20ingin%20konsultasi%20custom%20order.',
      action: 'Konsultasi custom',
      product: featuredProducts[2],
    },
  ];
  const slides: HeroSlide[] = banners.length ? banners.map(banner => ({
    eyebrow: banner.eyebrow,
    title: banner.title,
    description: banner.description,
    href: banner.href,
    action: banner.cta_label,
    imageUrl: banner.image_url,
    imageAlt: banner.title,
  })) : fallbackSlides;
  const slide = slides[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => setActiveIndex(index => (index + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  function moveSlide(direction: number) {
    setActiveIndex(index => (index + direction + slides.length) % slides.length);
  }

  return (
    <section id="promo" className="bg-white pb-6">
      <div className="container pt-4 md:pt-5">
        <div className="grid gap-3 min-[560px]:grid-cols-[minmax(0,1fr)_190px] xl:grid-cols-[238px_minmax(0,1fr)_224px]">
          <aside className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:block xl:col-start-1 xl:row-start-1">
            <div className="flex items-center gap-2 bg-[#12345b] px-4 py-3 text-sm font-bold text-white">
              <Package size={17} /> Pilih kategori
            </div>
            <nav aria-label="Kategori produk" className="divide-y divide-slate-100">
              {categories.slice(0, 9).map((category, index) => {
                const Icon = categoryIcons[index % categoryIcons.length];
                return (
                  <Link key={category.id} href={`/kategori/${category.slug}`} className="group flex min-h-10 items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-blue-50 hover:text-[#1769d2]">
                    <Icon size={16} className="shrink-0 text-[#1769d2]" />
                    <span className="min-w-0 flex-1 truncate">{category.name}</span>
                    <ArrowUpRight size={14} className="shrink-0 text-slate-400 transition group-hover:text-[#1769d2]" />
                  </Link>
                );
              })}
              {!categories.length && <Link href="/produk" className="block px-4 py-4 text-sm text-slate-500">Lihat semua produk</Link>}
            </nav>
          </aside>

          <div className="min-w-0 min-[560px]:col-start-1 min-[560px]:row-start-1 xl:col-start-2">
            <article aria-roledescription="carousel" aria-label="Promosi APRINTZ" className="relative min-h-[350px] overflow-hidden rounded-xl border border-blue-100 bg-[#e8f2ff] shadow-sm md:min-h-[390px]">
              <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-[linear-gradient(135deg,#d9e9fc_0%,#f7faff_100%)] md:block" />
              <div className="relative grid min-h-[350px] items-center gap-3 px-6 pb-16 pt-7 sm:px-9 md:min-h-[390px] md:grid-cols-[1.05fr_.95fr] md:px-10">
                <div className="relative z-10 max-w-xl">
                  <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#1769d2]">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {slide.eyebrow}
                  </p>
                  <h1 className="mt-4 max-w-[15ch] text-3xl font-black leading-[1.08] text-[#12345b] sm:text-4xl lg:text-[42px]">{slide.title}</h1>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 sm:text-base">{slide.description}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {slide.href.startsWith('http')
                      ? <a href={slide.href} target="_blank" rel="noreferrer" className="btn rounded-md px-4 py-2.5">{slide.action}<ArrowRight size={16} /></a>
                      : <Link href={slide.href} className="btn rounded-md px-4 py-2.5">{slide.action}<ArrowRight size={16} /></Link>}
                    <span className="text-xs font-semibold text-slate-500">Konsultasi sebelum produksi</span>
                  </div>
                </div>

                <div className="relative mx-auto flex h-[170px] w-full max-w-[360px] items-center justify-center sm:h-[210px] md:h-[280px]">
                  {(slide.imageUrl || slide.product?.imageUrl) ? (
                    <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-white/65 p-3 shadow-[0_16px_38px_rgba(18,52,91,0.12)]">
                      <img src={slide.imageUrl || slide.product?.imageUrl || ''} alt={slide.imageAlt || slide.product?.imageAlt || slide.title} className="h-full w-full rounded-md object-contain" />
                      <span className="absolute bottom-3 left-3 max-w-[80%] truncate rounded bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-[#12345b] shadow-sm">{slide.product?.name || 'Promo APRINTZ'}</span>
                    </div>
                  ) : (
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-white/80 bg-white/60">
                      <div className="absolute left-7 top-7 h-24 w-24 rotate-[-12deg] rounded-lg border border-blue-200 bg-blue-100/80 sm:h-32 sm:w-32" />
                      <div className="absolute bottom-7 right-7 h-28 w-24 rotate-[9deg] rounded-lg border border-amber-200 bg-amber-50/90 sm:h-36 sm:w-32" />
                      <div className="relative z-10 grid h-20 w-20 place-items-center rounded-xl bg-[#12345b] text-white shadow-xl sm:h-24 sm:w-24">
                        {activeIndex === 1 ? <Printer size={42} /> : <Gift size={42} />}
                      </div>
                      <span className="absolute bottom-3 left-3 rounded bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-[#12345b] shadow-sm">APRINTZ · CETAK & CUSTOM</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-3 left-6 flex items-center gap-2 sm:left-9">
                {slides.map((item, index) => (
                  <button key={item.eyebrow} type="button" onClick={() => setActiveIndex(index)} aria-label={`Tampilkan promosi ${index + 1}`} aria-pressed={activeIndex === index} className={`h-2 rounded-full transition-all ${activeIndex === index ? 'w-7 bg-[#1769d2]' : 'w-2 bg-blue-200 hover:bg-blue-400'}`} />
                ))}
              </div>
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button type="button" onClick={() => moveSlide(-1)} aria-label="Promosi sebelumnya" className="grid h-9 w-9 place-items-center rounded-full border border-blue-100 bg-white text-[#12345b] shadow-sm hover:bg-blue-50"><ChevronLeft size={18} /></button>
                <button type="button" onClick={() => moveSlide(1)} aria-label="Promosi berikutnya" className="grid h-9 w-9 place-items-center rounded-full border border-blue-100 bg-white text-[#12345b] shadow-sm hover:bg-blue-50"><ChevronRight size={18} /></button>
              </div>
            </article>

            <nav aria-label="Jelajahi kategori" className="mt-3 flex gap-2 overflow-x-auto pb-1 xl:hidden">
              {categories.map(category => <Link key={category.id} href={`/kategori/${category.slug}`} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-[#1769d2]">{category.name}</Link>)}
            </nav>
          </div>

          <aside className="hidden min-h-0 gap-3 min-[560px]:col-start-2 min-[560px]:row-start-1 min-[560px]:grid min-[560px]:grid-cols-1 min-[560px]:grid-rows-2 xl:col-start-3">
            <Link href="/produk" className="group relative flex min-h-0 flex-col justify-between overflow-hidden rounded-xl bg-[#12345b] p-4 text-white">
              <div className="absolute -right-4 -top-5 h-24 w-24 rotate-12 border border-white/15 bg-white/5" />
              <div className="relative flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-200">Untuk promosi</span><ArrowUpRight size={17} /></div>
              <div className="relative"><b className="block text-lg leading-tight">Cetak kebutuhan event</b><span className="mt-1 block text-xs text-blue-100">Spanduk, banner, stiker</span></div>
            </Link>
            <Link href="/tracking" className="group relative flex min-h-0 flex-col justify-between overflow-hidden rounded-xl bg-[#fff1e8] p-4 text-[#12345b]">
              <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#a64f2f]">Order lebih tenang</span><Truck size={18} className="text-[#a64f2f]" /></div>
              <div><b className="block text-lg leading-tight">Pantau pesananmu</b><span className="mt-1 block text-xs text-slate-600">Cek progres produksi dan pengiriman</span></div>
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}