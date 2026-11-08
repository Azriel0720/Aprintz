import CatalogBrowser from '@/components/CatalogBrowser';
import { getCatalogCategories, getCatalogProducts } from '@/lib/catalog';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const search = params.q?.trim().slice(0, 80) ?? '';
  const [{ categories, needsSetup: categoriesNeedSetup }, { products, needsSetup: productsNeedSetup }] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts({ search }),
  ]);

  return (
    <CatalogBrowser
      categories={categories}
      products={products}
      search={search}
      needsSetup={categoriesNeedSetup || productsNeedSetup}
    />
  );
}