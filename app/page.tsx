import Link from 'next/link';
import { ArrowRight, Headphones, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import HomeMarketplaceHero from '@/components/HomeMarketplaceHero';
import BusinessSupportShowcase from '@/components/BusinessSupportShowcase';
import ProductCarousel from '@/components/ProductCarousel';
import ScrollReveal from '@/components/ScrollReveal';
import { getCatalogCategories, getCatalogProducts } from '@/lib/catalog';
import { getHomepageContent } from '@/lib/homepage';

export default async function Home() {
  const [
    { categories },
    { products: generalProducts, needsSetup: generalProductsNeedSetup },
    { products: bestSellerProducts, needsSetup: bestSellerProductsNeedSetup },
    homepage,
  ] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts({ homeDisplay: 'general' }),
    getCatalogProducts({ homeDisplay: 'bestSeller' }),
    getHomepageContent(),
  ]);
  const businessCategory = categories.find(category => category.name.toLowerCase().includes('perlengkapan bisnis'));
  const businessProducts = businessCategory
    ? await getCatalogProducts({ categoryId: businessCategory.id })
    : { products: [] };

  return (
    <main>
      <HomeMarketplaceHero categories={categories} products={generalProducts} banners={homepage.banners} />

      <ScrollReveal><section className="border-y border-slate-100 bg-white py-3">
        <div className="container grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white"><Truck size={19} /></span><div><b className="text-sm">Kirim ke banyak area</b><p className="text-xs text-slate-500">Pilih pengiriman sesuai kebutuhan</p></div></div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white"><ShieldCheck size={19} /></span><div><b className="text-sm">Spesifikasi lebih jelas</b><p className="text-xs text-slate-500">Konfirmasi sebelum mulai produksi</p></div></div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white"><PackageCheck size={19} /></span><div><b className="text-sm">Progres pesanan tercatat</b><p className="text-xs text-slate-500">Pantau status order dengan mudah</p></div></div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white"><Headphones size={19} /></span><div><b className="text-sm">Dibantu tim APRINTZ</b><p className="text-xs text-slate-500">Konsultasi sebelum memesan</p></div></div>
        </div>
      </section></ScrollReveal>

      <ScrollReveal><section id="best-seller" className="bg-[#f3f7fc] py-9 md:py-12">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">FAVORIT PELANGGAN</p>
              <h2 className="mt-2 text-2xl font-black text-[#12345b] md:text-3xl">Best seller</h2>
            </div>
            <Link href="/produk" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700">Jelajahi katalog <ArrowRight size={16} /></Link>
          </div>
          {bestSellerProducts.length ? (
            <div className="mt-5"><ProductCarousel products={bestSellerProducts} /></div>
          ) : (
            <p className="mt-5 border-y border-slate-200 py-8 text-sm text-slate-500">
              {bestSellerProductsNeedSetup ? 'Katalog belum dapat dimuat. Periksa koneksi Supabase.' : 'Produk best seller akan tampil setelah ditandai dari panel admin.'}
            </p>
          )}
        </div>
      </section></ScrollReveal>

      {businessProducts.products.length > 0 && (
        <ScrollReveal><BusinessSupportShowcase products={businessProducts.products} /></ScrollReveal>
      )}

      <ScrollReveal><section id="produk" className="bg-[#f3f7fc] py-9 md:py-12">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">KATALOG APRINTZ</p>
              <h2 className="mt-2 text-2xl font-black text-[#12345b] md:text-3xl">Produk umum</h2>
              <p className="mt-1 text-sm text-slate-500">Harga awal tercantum, detail dikonfirmasi sebelum produksi.</p>
            </div>
            <Link href="/produk" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700">Semua produk <ArrowRight size={16} /></Link>
          </div>
          {generalProducts.length ? (
            <div className="mt-5"><ProductCarousel products={generalProducts} /></div>
          ) : (
            <p className="mt-8 border-y border-slate-200 py-8 text-sm text-slate-500">
              {generalProductsNeedSetup ? 'Katalog belum dapat dimuat. Periksa koneksi Supabase.' : 'Produk umum akan tampil setelah dipilih dari panel admin.'}
            </p>
          )}
          <Link href="/produk" className="btn btn-outline mt-6">Lihat semua produk</Link>
        </div>
      </section></ScrollReveal>

      <ScrollReveal><section id="cara-pesan" className="py-16 md:py-20">
        <div className="container">
          <div className="text-center"><p className="eyebrow">CARA ORDER</p><h2 className="mt-3 text-3xl font-black text-[#12345b]">Pesan dalam beberapa langkah</h2></div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              ['01', 'Pilih produk', 'Tentukan produk sesuai kebutuhan.'],
              ['02', 'Atur spesifikasi', 'Pilih variasi yang tersedia dan jumlah.'],
              ['03', 'Konsultasi desain', 'Hubungi tim untuk membahas file dan kebutuhan desain.'],
              ['04', 'Konfirmasi pesanan', 'Tim APRINTZ meninjau detail dan estimasi biaya.'],
            ].map(([number, title, description]) => (
              <div key={number} className="border-t-2 border-blue-500 bg-white p-5">
                <span className="text-2xl font-black text-blue-600">{number}</span>
                <h3 className="mt-4 font-bold text-[#12345b]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section></ScrollReveal>
    </main>
  );
}
