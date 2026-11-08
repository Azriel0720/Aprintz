import 'server-only';

import { supabase } from '@/lib/supabase';
import { isHiddenPublicCategory } from '@/lib/catalog-visibility';

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  showOnHome: boolean;
  isBestSeller: boolean;
  ratingAverage: number;
  reviewCount: number;
  imageUrl: string | null;
  imageAlt: string;
  images: { id: string; url: string; alt: string }[];
  specifications: string;
  importantNote: string;
  options: string[];
  variants: { id: string; name: string; unitPrice: number; minQuantity: number }[];
};

export async function getCatalogCategories() {
  if (!supabase) return { categories: [] as CatalogCategory[], needsSetup: true };

  const { data, error } = await supabase
    .from('categories')
    .select('id,slug,name,description')
    .eq('is_active', true)
    .order('display_order');

  return {
    categories: ((data ?? []) as CatalogCategory[]).filter(category => !isHiddenPublicCategory(category.slug, category.name)),
    needsSetup: Boolean(error),
  };
}

export async function getCatalogProducts(options: {
  categoryId?: string;
  search?: string;
  homeDisplay?: 'general' | 'bestSeller';
} = {}) {
  if (!supabase) return { products: [] as CatalogProduct[], needsSetup: true };

  const { data: hiddenCategories, error: hiddenCategoriesError } = await supabase
    .from('categories')
    .select('id,slug,name')
    .in('slug', ['large-format', 'offset-printing']);
  if (hiddenCategoriesError) {
    console.error('Failed to load hidden public catalog categories:', hiddenCategoriesError);
    return { products: [] as CatalogProduct[], needsSetup: true };
  }
  const hiddenCategoryIds = (hiddenCategories ?? [])
    .filter(category => isHiddenPublicCategory(category.slug, category.name))
    .map(category => category.id);

  let query = supabase
    .from('products')
    .select('id,slug,name,category,category_id,description,base_price,unit,show_on_home,is_best_seller')
    .eq('is_active', true)
    .order('name')
    .limit(options.homeDisplay ? 12 : 300);

  if (options.categoryId) query = query.eq('category_id', options.categoryId);
  if (hiddenCategoryIds.length) query = query.not('category_id', 'in', `(${hiddenCategoryIds.join(',')})`);
  if (options.search) query = query.ilike('name', `%${options.search}%`);
  if (options.homeDisplay === 'general') query = query.eq('show_on_home', true);
  if (options.homeDisplay === 'bestSeller') query = query.eq('is_best_seller', true);

  const { data, error } = await query;
  if (error || !data) return { products: [] as CatalogProduct[], needsSetup: Boolean(error) };

  const ids = data.map(product => product.id);
  const [{ data: images }, { data: reviews, error: reviewsError }] = ids.length
    ? await Promise.all([
        supabase
        .from('product_images')
        .select('id,product_id,image_url,alt_text,display_order')
        .in('product_id', ids)
        .order('display_order'),
        supabase
        .from('product_reviews')
        .select('product_id,rating')
        .in('product_id', ids)
        .limit(10000),
      ])
    : [{ data: [] }, { data: [], error: null }];
  if (reviewsError) console.error('Failed to load catalog product ratings:', reviewsError);

  const ratingsByProduct = new Map<string, number[]>();
  for (const review of reviews ?? []) {
    const ratings = ratingsByProduct.get(review.product_id) ?? [];
    ratings.push(review.rating);
    ratingsByProduct.set(review.product_id, ratings);
  }

  const imageByProduct = new Map<string, { id: string; url: string; alt: string }[]>();
  for (const image of images ?? []) {
    const productImages = imageByProduct.get(image.product_id) ?? [];
    productImages.push({ id: image.id, url: image.image_url, alt: image.alt_text });
    imageByProduct.set(image.product_id, productImages);
  }

  return {
    products: data.filter(product => !isHiddenPublicCategory(null, product.category)).map(product => {
      const productImages = imageByProduct.get(product.id) ?? [];
      const image = productImages[0];
      const ratings = ratingsByProduct.get(product.id) ?? [];
      const ratingTotal = ratings.reduce((sum, rating) => sum + rating, 0);
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        description: product.description ?? '',
        price: Number(product.base_price),
        unit: product.unit,
        showOnHome: product.show_on_home,
        isBestSeller: product.is_best_seller,
        ratingAverage: ratings.length ? ratingTotal / ratings.length : 0,
        reviewCount: ratings.length,
        imageUrl: image?.url ?? null,
        imageAlt: image?.alt ?? product.name,
        images: productImages,
        specifications: '',
        importantNote: '',
        options: [],
        variants: [],
      };
    }) as CatalogProduct[],
    needsSetup: false,
  };
}

export async function getCatalogCategory(slug: string) {
  if (!supabase) return { category: null, products: [] as CatalogProduct[], needsSetup: true };
  if (isHiddenPublicCategory(slug)) return { category: null, products: [] as CatalogProduct[], needsSetup: false };

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id,slug,name,description')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (categoryError || !category) {
    return { category: null, products: [] as CatalogProduct[], needsSetup: Boolean(categoryError) };
  }

  const result = await getCatalogProducts({ categoryId: category.id });
  return { category: category as CatalogCategory, ...result };
}

export async function getCatalogProduct(slug: string) {
  if (!supabase) return null;

  const { data: product, error } = await supabase
    .from('products')
    .select('id,slug,name,category,description,base_price,unit')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !product || isHiddenPublicCategory(null, product.category)) return null;

  const [variantsResult, imagesResult, contentResult] = await Promise.all([
    supabase
      .from('product_variants')
      .select('id,name,unit_price,min_quantity,display_order')
      .eq('product_id', product.id)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('product_images')
      .select('id,image_url,alt_text,display_order')
      .eq('product_id', product.id)
      .order('display_order'),
    supabase
      .from('products')
      .select('specifications,important_note')
      .eq('id', product.id)
      .maybeSingle(),
  ]);

  if (variantsResult.error) console.error('Failed to load product variants:', variantsResult.error);
  if (imagesResult.error) console.error('Failed to load product images:', imagesResult.error);
  const missingContentMigration = contentResult.error?.code === '42703' || contentResult.error?.code === 'PGRST204';
  if (contentResult.error && !missingContentMigration) console.error('Failed to load product content:', contentResult.error);
  const productImages = (imagesResult.data ?? []).map(image => ({ id: image.id, url: image.image_url, alt: image.alt_text }));
  const image = productImages[0];
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    description: product.description ?? '',
    price: Number(product.base_price),
    unit: product.unit,
    showOnHome: false,
    isBestSeller: false,
    ratingAverage: 0,
    reviewCount: 0,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt ?? product.name,
    images: productImages,
    specifications: contentResult.data?.specifications ?? '',
    importantNote: contentResult.data?.important_note ?? '',
    options: (variantsResult.data ?? []).map(variant => variant.name),
    variants: (variantsResult.data ?? []).map(variant => ({
      id: variant.id,
      name: variant.name,
      unitPrice: Number(variant.unit_price),
      minQuantity: variant.min_quantity,
    })),
  } as CatalogProduct;
}