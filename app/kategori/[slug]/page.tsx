import Link from 'next/link';
import CatalogBrowser from '@/components/CatalogBrowser';
import { getCatalogCategories, getCatalogCategory } from '@/lib/catalog';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ categories, needsSetup: categoriesNeedSetup }, result] = await Promise.all([
    getCatalogCategories(),
    getCatalogCategory(slug),
  ]);

  if (!result.category) {
    return (
      <main className="container min-h-[70vh] py-14">
        <p className="eyebrow">KATALOG APRINTZ</p>
        <h1 className="mt-3 text-3xl font-black text-[#12345b]">Kategori belum tersedia</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
          {result.needsSetup || categoriesNeedSetup
            ? 'Struktur kategori belum aktif di database. Terapkan migration Supabase terlebih dahulu.'
            : 'Kategori ini tidak ditemukan atau sedang tidak aktif.'}
        </p>
        <Link href="/produk" className="btn mt-6">Lihat semua produk</Link>
      </main>
    );
  }

  return (
    <CatalogBrowser
      categories={categories}
      products={result.products}
      activeCategory={result.category.name}
      needsSetup={result.needsSetup}
    />
  );
}