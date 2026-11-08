import Link from 'next/link';
import { ArrowRight, PackageCheck } from 'lucide-react';
import { formatIDR } from '@/lib/products';
import type { CatalogProduct } from '@/lib/catalog';
import ProductReviewBadge from '@/components/ProductReviewBadge';

function ProductTile({ product, featured = false }: { product: CatalogProduct; featured?: boolean }) {
  return (
    <Link
      href={`/produk/${product.slug}`}
      className={`group relative overflow-hidden rounded-xl bg-slate-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${featured ? 'min-h-32' : 'flex min-h-28 items-center gap-3 bg-white p-2.5'}`}
    >
      {featured ? (
        <>
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.imageAlt} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            : <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(145deg,#e5effb,#f9fbfe)] text-brand-700"><PackageCheck size={36} /></div>}
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 right-3">
            <span className="grid justify-items-start gap-1">
              <span className="inline-block max-w-full truncate rounded-md bg-black/70 px-2.5 py-1.5 text-xs font-bold text-white">{product.name}</span>
              <span className="rounded bg-white/95 px-2 py-1"><ProductReviewBadge average={product.ratingAverage} count={product.reviewCount} compact /></span>
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
            {product.imageUrl
              ? <img src={product.imageUrl} alt={product.imageAlt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              : <PackageCheck size={30} className="text-brand-600" />}
          </span>
          <span className="min-w-0">
            <span className="block line-clamp-2 text-sm font-bold leading-5 text-[#12345b]">{product.name}</span>
            <span className="mt-1 block truncate text-xs text-slate-500">{product.category}</span>
            <ProductReviewBadge average={product.ratingAverage} count={product.reviewCount} compact />
            <span className="mt-1 block text-sm font-black text-red-600">{formatIDR(product.price)}<span className="font-medium text-slate-500"> / {product.unit}</span></span>
          </span>
        </>
      )}
    </Link>
  );
}

export default function BusinessSupportShowcase({ products }: { products: CatalogProduct[] }) {
  const listProducts = products.slice(0, 4);
  const featuredProducts = products.slice(4, 7);

  return (
    <section className="container py-8 md:py-10">
      <div className="mb-4 flex items-center gap-4">
        <h2 className="shrink-0 text-lg font-bold text-[#12345b] md:text-xl">Penunjang Bisnis Anda</h2>
        <span aria-hidden="true" className="hidden h-2 flex-1 border-b-2 border-dotted border-slate-300 sm:block" />
        <Link href="/produk" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700">Lihat Semua <ArrowRight size={16} /></Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
        <div className="grid auto-rows-fr gap-3 rounded-2xl bg-slate-200/80 p-3 sm:grid-cols-2 sm:p-4">
          {listProducts.map(product => <ProductTile key={product.id} product={product} />)}
        </div>
        {featuredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><ProductTile product={featuredProducts[0]} featured /></div>
            {featuredProducts.slice(1).map(product => <ProductTile key={product.id} product={product} featured />)}
          </div>
        )}
      </div>
    </section>
  );
}
