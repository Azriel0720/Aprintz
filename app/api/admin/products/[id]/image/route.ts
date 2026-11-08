import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const productIdSchema = z.string().uuid();
const uploadedImageSchema = z.object({
  path: z.string().max(200),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileName: z.string().trim().min(1).max(255),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
  if (user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Akun ini tidak memiliki akses admin.' }, { status: 403 });
  }
  if (!supabase) return NextResponse.json({ error: 'Database admin belum dikonfigurasi.' }, { status: 503 });
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json(
      { error: 'Halaman admin yang terbuka masih versi lama. Muat ulang paksa dengan Ctrl+Shift+R, lalu unggah foto kembali.' },
      { status: 409 },
    );
  }

  const { id: productId } = await params;
  if (!productIdSchema.safeParse(productId).success) {
    return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 });
  }

  const parsed = uploadedImageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Data foto tidak valid.' }, { status: 400 });
  const { path, contentType, fileName } = parsed.data;
  const pathPattern = new RegExp(`^${productId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`, 'i');
  if (!pathPattern.test(path)) return NextResponse.json({ error: 'Lokasi foto tidak valid.' }, { status: 400 });
  const extension = path.split('.').pop()?.toLowerCase();
  const expectedContentType = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
  if (contentType !== expectedContentType) return NextResponse.json({ error: 'Tipe foto tidak cocok dengan file.' }, { status: 400 });

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .maybeSingle();
  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });

  const { data: existingImages, error: existingError } = await supabase
    .from('product_images')
    .select('id,image_url,display_order')
    .eq('product_id', productId)
    .order('display_order')
    .limit(20);
  if (existingError) {
    const { error: cleanupError } = await supabase.storage.from('product-images').remove([path]);
    if (cleanupError) console.error('Failed to remove unregistered product image:', cleanupError);
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if ((existingImages ?? []).length >= 20) {
    const { error: cleanupError } = await supabase.storage.from('product-images').remove([path]);
    if (cleanupError) console.error('Failed to remove over-limit product image:', cleanupError);
    return NextResponse.json({ error: 'Maksimal 20 foto untuk setiap produk.' }, { status: 400 });
  }

  const folder = path.slice(0, path.lastIndexOf('/'));
  const fileNameInStorage = path.slice(path.lastIndexOf('/') + 1);
  const { data: storedFiles, error: storageReadError } = await supabase.storage
    .from('product-images')
    .list(folder, { search: fileNameInStorage, limit: 1 });
  if (storageReadError) {
    const { error: cleanupError } = await supabase.storage.from('product-images').remove([path]);
    if (cleanupError) console.error('Failed to remove unverified product image:', cleanupError);
    return NextResponse.json({ error: storageReadError.message }, { status: 500 });
  }
  if (!storedFiles?.some(file => file.name === fileNameInStorage)) {
    return NextResponse.json({ error: 'Upload foto belum selesai. Coba unggah kembali.' }, { status: 400 });
  }

  const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(path);
  const imageRecord = {
    product_id: productId,
    image_url: publicUrl.publicUrl,
    alt_text: fileName,
    display_order: Math.max(-1, ...(existingImages ?? []).map(image => image.display_order)) + 1,
  };
  const result = await supabase.from('product_images').insert(imageRecord).select().single();
  if (result.error) {
    const { error: cleanupError } = await supabase.storage.from('product-images').remove([path]);
    if (cleanupError) console.error('Failed to remove unregistered product image:', cleanupError);
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ image: result.data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
  if (user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Akun ini tidak memiliki akses admin.' }, { status: 403 });
  }
  if (!supabase) return NextResponse.json({ error: 'Database admin belum dikonfigurasi.' }, { status: 503 });

  const { id: productId } = await params;
  if (!productIdSchema.safeParse(productId).success) return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 });
  const body = await request.json();
  const imageId = productIdSchema.safeParse(body.imageId);
  if (!imageId.success) return NextResponse.json({ error: 'ID foto tidak valid.' }, { status: 400 });

  const { data: image, error: readError } = await supabase
    .from('product_images')
    .select('id,image_url')
    .eq('id', imageId.data)
    .eq('product_id', productId)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!image) return NextResponse.json({ error: 'Foto produk tidak ditemukan.' }, { status: 404 });

  const { error: deleteError } = await supabase.from('product_images').delete().eq('id', image.id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const publicPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/`;
  if (image.image_url.startsWith(publicPrefix)) {
    const path = decodeURIComponent(image.image_url.slice(publicPrefix.length));
    const { error: storageError } = await supabase.storage.from('product-images').remove([path]);
    if (storageError) return NextResponse.json({ error: `Foto dihapus dari katalog, tetapi gagal dihapus dari storage: ${storageError.message}` }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}