import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const requestSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
const extensionByType = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
  if (user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Akun ini tidak memiliki akses admin.' }, { status: 403 });
  }
  if (!supabase) return NextResponse.json({ error: 'Database admin belum dikonfigurasi.' }, { status: 503 });

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Format foto tidak didukung.' }, { status: 400 });
  const { id: productId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
    return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 });
  }

  const [{ data: product, error: productError }, { data: existingImages, error: imagesError }] = await Promise.all([
    supabase.from('products').select('id').eq('id', productId).maybeSingle(),
    supabase.from('product_images').select('id').eq('product_id', productId).limit(20),
  ]);
  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (imagesError) return NextResponse.json({ error: imagesError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
  if ((existingImages ?? []).length >= 20) {
    return NextResponse.json({ error: 'Maksimal 20 foto untuk setiap produk.' }, { status: 400 });
  }

  const extension = extensionByType[parsed.data.contentType];
  const path = `${productId}/${randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage.from('product-images').createSignedUploadUrl(path, { upsert: false });
  if (error) {
    const message = error.message.toLowerCase().includes('bucket') || error.message.toLowerCase().includes('not found')
      ? 'Bucket product-images belum dibuat di Supabase. Jalankan schema SQL di Supabase untuk membuat bucket storage.'
      : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ path: data.path, token: data.token });
}
