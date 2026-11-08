import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const schema = z.object({
	status: z.enum([
		'Menunggu konfirmasi',
		'Menunggu pembayaran',
		'Pembayaran berhasil',
		'Proses desain',
		'Menunggu persetujuan desain',
		'Dalam produksi',
		'Quality control',
		'Siap dikirim/diambil',
		'Dalam pengiriman',
		'Selesai',
		'Dibatalkan',
	]).optional(),
	admin_notes: z.string().max(5000).optional(),
	shipping_courier: z.string().trim().max(80).nullable().optional(),
	tracking_number: z.string().trim().max(120).nullable().optional(),
	shipped_at: z.string().datetime().nullable().optional(),
}).refine(value => value.status !== undefined || value.admin_notes !== undefined || value.shipping_courier !== undefined || value.tracking_number !== undefined || value.shipped_at !== undefined);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
	if (user.app_metadata?.role !== 'admin') {
		return NextResponse.json({ error: 'Akun ini tidak memiliki akses admin.' }, { status: 403 });
	}
	if (!supabase) return NextResponse.json({ error: 'Database belum dikonfigurasi.' }, { status: 503 });
	const client = supabase;

	const { id } = await params;
	const { data: order, error: orderError } = await client
		.from('orders')
		.select('id,order_number,customer_name,email,phone,address,status,total_estimate,created_at,notes,admin_notes,shipping_courier,tracking_number,shipped_at')
		.eq('id', id)
		.maybeSingle();
	if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
	if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });

	const [itemsResult, designsResult] = await Promise.all([
		client.from('order_items').select('id,product_name,specification,quantity,unit_price_estimate,note,design_url').eq('order_id', id),
		client.from('order_designs').select('id,storage_path,original_file_name,content_type,file_size,review_status,created_at').eq('order_id', id).order('created_at', { ascending: false }),
	]);
	let orderItems = itemsResult.data;
	let itemsError = itemsResult.error;
	const missingDesignUrlColumn = /design_url/i.test(itemsResult.error?.message ?? '')
		&& (itemsResult.error?.code === 'PGRST204' || itemsResult.error?.code === '42703');
	if (missingDesignUrlColumn) {
		const fallbackItems = await client
			.from('order_items')
			.select('id,product_name,specification,quantity,unit_price_estimate,note')
			.eq('order_id', id);
		orderItems = fallbackItems.data?.map(item => ({ ...item, design_url: null })) ?? null;
		itemsError = fallbackItems.error;
	}
	if (itemsError && itemsError.code !== 'PGRST205' && itemsError.code !== '42P01') {
		return NextResponse.json({ error: itemsError.message }, { status: 500 });
	}
	if (designsResult.error && designsResult.error.code !== 'PGRST205' && designsResult.error.code !== '42P01') {
		return NextResponse.json({ error: designsResult.error.message }, { status: 500 });
	}

	const designs = await Promise.all((designsResult.data ?? []).map(async design => {
		const bucket = client.storage.from('order-designs');
		const [previewResult, downloadResult] = await Promise.all([
			bucket.createSignedUrl(design.storage_path, 300),
			bucket.createSignedUrl(design.storage_path, 300, { download: design.original_file_name }),
		]);
		return {
			id: design.id,
			fileName: design.original_file_name,
			contentType: design.content_type,
			fileSize: design.file_size,
			reviewStatus: design.review_status,
			createdAt: design.created_at,
			previewUrl: previewResult.error ? null : previewResult.data?.signedUrl ?? null,
			downloadUrl: downloadResult.error ? null : downloadResult.data?.signedUrl ?? null,
		};
	}));

	return NextResponse.json({
		order: {
			...order,
			order_items: orderItems ?? [],
			designs,
		},
	});
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
	if (user.app_metadata?.role !== 'admin') {
		return NextResponse.json({ error: 'Akun ini tidak memiliki akses admin.' }, { status: 403 });
	}
	if (!supabase) return NextResponse.json({ error: 'Database belum dikonfigurasi.' }, { status: 503 });

	const parsed = schema.safeParse(await req.json());
	if (!parsed.success) return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });

	const { id } = await params;
	const { data, error } = await supabase.from('orders').update(parsed.data).eq('id', id).select().single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ order: data });
}
