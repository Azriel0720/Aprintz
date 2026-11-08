import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  categoryId: z.string().uuid(),
  description: z.string().trim().max(2000).default(''),
  specifications: z.string().max(5000).default(''),
  importantNote: z.string().max(3000).default(''),
  basePrice: z.number().finite().min(0).max(1_000_000_000),
  unit: z.string().trim().min(1).max(32),
  stockQuantity: z.number().int().min(0).max(1_000_000_000),
  isActive: z.boolean(),
  showOnHome: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
});

function productContentMigrationMissing(error: { code?: string; message?: string }) {
  const mentionsContentColumn = /specifications|important_note/i.test(error.message ?? '');
  return mentionsContentColumn && (error.code === '42703' || error.code === 'PGRST204');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
  if (user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Akun ini tidak memiliki akses admin.' }, { status: 403 });
  }
  if (!supabase) return NextResponse.json({ error: 'Database admin belum dikonfigurasi.' }, { status: 503 });

  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Data produk tidak valid.' }, { status: 400 });
  const { id } = await params;

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('name')
    .eq('id', parsed.data.categoryId)
    .maybeSingle();
  if (categoryError) return NextResponse.json({ error: categoryError.message }, { status: 500 });
  if (!category) return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 400 });

  const productData = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    category_id: parsed.data.categoryId,
    category: category.name,
    description: parsed.data.description,
    specifications: parsed.data.specifications,
    important_note: parsed.data.importantNote,
    base_price: parsed.data.basePrice,
    unit: parsed.data.unit,
    stock_quantity: parsed.data.stockQuantity,
    is_active: parsed.data.isActive,
    show_on_home: parsed.data.showOnHome,
    is_best_seller: parsed.data.isBestSeller,
  };
  const { data: fullData, error: fullError } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .select('id,name,slug,category_id,description,specifications,important_note,base_price,unit,stock_quantity,is_active,show_on_home,is_best_seller,created_at')
    .maybeSingle();

  let data: {
    id: string;
    name: string;
    slug: string;
    category_id: string | null;
    description: string | null;
    specifications?: string;
    important_note?: string;
    base_price: number;
    unit: string;
    stock_quantity: number;
    is_active: boolean;
    show_on_home: boolean;
    is_best_seller: boolean;
    created_at: string;
  } | null = fullData;
  let error = fullError;
  let warning: string | undefined;
  if (productContentMigrationMissing(fullError ?? {})) {
    const fallback = await supabase
      .from('products')
      .update({
        name: productData.name,
        slug: productData.slug,
        category_id: productData.category_id,
        category: productData.category,
        description: productData.description,
        base_price: productData.base_price,
        unit: productData.unit,
        stock_quantity: productData.stock_quantity,
        is_active: productData.is_active,
        show_on_home: productData.show_on_home,
        is_best_seller: productData.is_best_seller,
      })
      .eq('id', id)
      .select('id,name,slug,category_id,description,base_price,unit,stock_quantity,is_active,show_on_home,is_best_seller,created_at')
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
    warning = 'Perubahan produk tersimpan, tetapi spesifikasi dan catatan belum tersimpan. Jalankan migration Supabase product_content_reviews terlebih dahulu.';
  }

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: status === 409 ? 'Slug produk sudah digunakan.' : error.message }, { status });
  }
  if (!data) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ product: data, warning });
}