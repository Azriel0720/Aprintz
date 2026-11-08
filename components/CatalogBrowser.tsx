'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { formatIDR } from '@/lib/products';
import type { CatalogCategory, CatalogProduct } from '@/lib/catalog';
import ProductReviewBadge from '@/components/ProductReviewBadge';

type CatalogBrowserProps = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  activeCategory?: string;
  search?: string;
  needsSetup?: boolean;
};

export default function CatalogBrowser({
  categories,
  products,
  activeCategory,
  search = '',
  needsSetup = false,
}: CatalogBrowserProps) {
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const pageCount = Math.ceil(products.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const pageItems: (number | 'ellipsis-start' | 'ellipsis-end')[] = pageCount <= 6
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : currentPage <= 4
      ? [1, 2, 3, 4, 'ellipsis-end', pageCount]
      : currentPage >= pageCount - 3
        ? [1, 'ellipsis-start', pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
        : [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', pageCount];
  const visibleProducts = useMemo(
    () => products.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, products],
  );

  return (
    <main className="container min-h-[70vh] py-10 md:py-14">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">KATALOG APRINTZ</p>
          <h1 className="mt-2 text-3xl font-black text-[#12345b] md:text-4xl">
            {activeCategory || 'Semua produk'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Pilih kebutuhan cetak dan konsultasikan spesifikasi sebelum produksi.
          </p>
        </div>
        <form action="/produk" className="flex w-full max-w-md gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Cari produk</span>
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="field pl-10"
              name="q"
              defaultValue={search}
              placeholder="Cari produk percetakan"
            />
          </label>
          <button className="btn">Cari</button>
        </form>
      </header>

      <nav aria-label="Kategori produk" className="flex gap-2 overflow-x-auto py-5">
        <Link
          href="/produk"
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${!activeCategory ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}
        >
          Semua
        </Link>
        {categories.map(category => (
          <Link
            key={category.id}
            href={`/kategori/${category.slug}`}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${activeCategory === category.name ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}
          >
            {category.name}
          </Link>
        ))}
      </nav>

      {needsSetup && (
        <p role="status" className="my-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Katalog kategori sedang disiapkan. Admin perlu menerapkan migration Supabase.
        </p>
      )}

      {products.length ? (
        <>
        <section key={currentPage} aria-label="Daftar produk" className="catalog-results-enter grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map(product => (
            <article key={product.id} className="group min-w-0 rounded-xl p-2 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg">
              <Link href={`/produk/${product.slug}`} className="group block">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {product.imageUrl ? (
                    // Catalog imagery is supplied by the product record; no stock image is implied.
                    <img src={product.imageUrl} alt={product.imageAlt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="px-4 text-center text-sm font-medium text-slate-500">Foto produk belum tersedia</span>
                  )}
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-500">{product.category}</p>
                <h2 className="mt-1 text-lg font-bold text-[#12345b] group-hover:text-blue-700">{product.name}</h2>
                <ProductReviewBadge average={product.ratingAverage} count={product.reviewCount} />
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{product.description}</p>
                <p className="mt-3 text-sm text-slate-500">Mulai</p>
                <p className="font-bold text-blue-700">{formatIDR(product.price)} <span className="font-normal text-slate-500">/ {product.unit}</span></p>
              </Link>
            </article>
          ))}
        </section>
        {pageCount > 1 && (
          <nav aria-label="Navigasi halaman produk" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
              Sebelumnya
            </button>
            {pageItems.map((item, index) => typeof item === 'number' ? (
              <button
                key={item}
                type="button"
                aria-current={item === currentPage ? 'page' : undefined}
                aria-label={`Halaman ${item}`}
                onClick={() => setPage(item)}
                className={`grid h-10 min-w-10 place-items-center rounded-md border px-3 text-sm font-bold ${item === currentPage ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'}`}
              >
                {item}
              </button>
            ) : (
              <span key={item} aria-hidden="true" className={`px-1 text-slate-400 ${index === 1 ? 'pagination-ellipsis-left' : ''}`}>…</span>
            ))}
            <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
              Berikutnya
            </button>
          </nav>
        )}
        </>
      ) : (
        <section className="border-y border-slate-200 py-16 text-center">
          <h2 className="text-lg font-bold text-[#12345b]">Produk belum tersedia</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            {search ? 'Coba kata pencarian lain atau pilih kategori berbeda.' : 'Produk untuk kategori ini belum ditambahkan.'}
          </p>
          <a
            href="https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20ingin%20bertanya%20tentang%20produk%20percetakan."
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex font-bold text-blue-700 underline"
          >
            Konsultasi via WhatsApp
          </a>
        </section>
      )}
    </main>
  );
}