import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const reviewSchema = z.object({
  orderNumber: z.string().trim().min(5).max(40),
  email: z.string().trim().email().max(254),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(8).max(1200),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!supabase) return NextResponse.json({ error: 'Database belum dikonfigurasi.' }, { status: 503 });
  const { slug } = await params;
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });

  const { data: reviews, error } = await supabase
    .from('product_reviews')
    .select('id,customer_name,rating,content,created_at')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const list = reviews ?? [];
  const average = list.length ? list.reduce((sum, review) => sum + review.rating, 0) / list.length : 0;
  return NextResponse.json({ reviews: list, count: list.length, average });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!supabase) return NextResponse.json({ error: 'Database belum dikonfigurasi.' }, { status: 503 });
  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Data ulasan belum lengkap atau tidak valid.' }, { status: 400 });

  const { slug } = await params;
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,email,customer_name,status')
    .eq('order_number', parsed.data.orderNumber)
    .maybeSingle();
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
  if (!order || order.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
    return NextResponse.json({ error: 'Nomor pesanan atau email tidak cocok.' }, { status: 400 });
  }
  if (!['Dalam pengiriman', 'Selesai'].includes(order.status)) {
    return NextResponse.json({ error: 'Ulasan dapat diberikan setelah pesanan dikirim atau berstatus Selesai.' }, { status: 400 });
  }

  const { data: orderedProduct, error: itemError } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', order.id)
    .eq('product_id', product.id)
    .limit(1)
    .maybeSingle();
  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });
  if (!orderedProduct) {
    return NextResponse.json({ error: 'Pesanan ini tidak mencakup produk yang sedang diulas.' }, { status: 403 });
  }

  const { data: review, error } = await supabase
    .from('product_reviews')
    .insert({
      product_id: product.id,
      order_id: order.id,
      customer_name: order.customer_name,
      rating: parsed.data.rating,
      content: parsed.data.content,
    })
    .select('id,customer_name,rating,content,created_at')
    .single();
  if (error?.code === '23505') {
    return NextResponse.json({ error: 'Anda sudah pernah mengulas produk ini untuk pesanan tersebut.' }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review }, { status: 201 });
}
