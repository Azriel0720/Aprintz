import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const hrefSchema = z.string().trim().min(1).max(500).refine(value => (value.startsWith('/') && !value.startsWith('//')) || /^https:\/\//.test(value));

const bannerSchema = z.object({
	eyebrow: z.string().max(80),
	title: z.string().trim().min(3).max(140),
	description: z.string().max(300),
	cta_label: z.string().trim().min(1).max(50),
	href: hrefSchema,
	image_url: z.string().url(),
	image_path: z.string().min(1).max(300),
	display_order: z.number().int().min(0).max(1000),
	is_active: z.boolean(),
});

const reviewSchema = z.object({
	customer_name: z.string().trim().min(2).max(100),
	company: z.string().max(120),
	content: z.string().trim().min(8).max(1200),
	rating: z.number().int().min(1).max(5),
	image_url: z.string().url().nullable(),
	image_path: z.string().max(300).nullable(),
	display_order: z.number().int().min(0).max(1000),
	is_active: z.boolean(),
});

async function getAdminError() {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
	if (user.app_metadata?.role !== 'admin') return NextResponse.json({ error: 'Akun ini tidak memiliki akses admin.' }, { status: 403 });
	if (!supabase) return NextResponse.json({ error: 'Database admin belum dikonfigurasi.' }, { status: 503 });
	return null;
}

export async function GET() {
	const denied = await getAdminError();
	if (denied) return denied;
	const [banners, reviews] = await Promise.all([
	supabase!.from('homepage_banners').select('*').order('display_order'),
	supabase!.from('homepage_reviews').select('*').order('display_order'),
	]);
	if (banners.error || reviews.error) return NextResponse.json({ error: banners.error?.message || reviews.error?.message }, { status: 500 });
	return NextResponse.json({ banners: banners.data ?? [], reviews: reviews.data ?? [] });
}

export async function POST(request: NextRequest) {
	const denied = await getAdminError();
	if (denied) return denied;
	const body = await request.json();
	if (body.collection === 'banners') {
		const parsed = bannerSchema.safeParse(body.record);
		if (!parsed.success) return NextResponse.json({ error: 'Data banner belum lengkap atau tidak valid.' }, { status: 400 });
		const { data, error } = await supabase!.from('homepage_banners').insert(parsed.data).select().single();
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		return NextResponse.json({ record: data }, { status: 201 });
	}
	if (body.collection === 'reviews') {
		const parsed = reviewSchema.safeParse(body.record);
		if (!parsed.success) return NextResponse.json({ error: 'Data ulasan belum lengkap atau tidak valid.' }, { status: 400 });
		const { data, error } = await supabase!.from('homepage_reviews').insert(parsed.data).select().single();
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		return NextResponse.json({ record: data }, { status: 201 });
	}
	return NextResponse.json({ error: 'Jenis konten tidak valid.' }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
	const denied = await getAdminError();
	if (denied) return denied;
	const body = await request.json();
	const id = z.string().uuid().safeParse(body.id);
	if (!id.success) return NextResponse.json({ error: 'ID konten tidak valid.' }, { status: 400 });

	const table = body.collection === 'banners' ? 'homepage_banners' : body.collection === 'reviews' ? 'homepage_reviews' : null;
	const schema = body.collection === 'banners' ? bannerSchema : body.collection === 'reviews' ? reviewSchema : null;
	if (!table || !schema) return NextResponse.json({ error: 'Jenis konten tidak valid.' }, { status: 400 });
	const parsed = schema.safeParse(body.record);
	if (!parsed.success) return NextResponse.json({ error: 'Data konten belum lengkap atau tidak valid.' }, { status: 400 });

	const { data: previous } = await supabase!.from(table).select('image_path').eq('id', id.data).maybeSingle();
	const { data, error } = await supabase!.from(table).update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', id.data).select().single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	if (previous?.image_path && previous.image_path !== data.image_path) await supabase!.storage.from('product-images').remove([previous.image_path]);
	return NextResponse.json({ record: data });
}

export async function DELETE(request: NextRequest) {
	const denied = await getAdminError();
	if (denied) return denied;
	const body = await request.json();
	const parsedId = z.string().uuid().safeParse(body.id);
	if (!parsedId.success) return NextResponse.json({ error: 'ID konten tidak valid.' }, { status: 400 });
	const table = body.collection === 'banners' ? 'homepage_banners' : body.collection === 'reviews' ? 'homepage_reviews' : null;
	if (!table) return NextResponse.json({ error: 'Jenis konten tidak valid.' }, { status: 400 });
	const { data: record, error: readError } = await supabase!.from(table).select('image_path').eq('id', parsedId.data).maybeSingle();
	if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
	const { error } = await supabase!.from(table).delete().eq('id', parsedId.data);
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	if (record?.image_path) await supabase!.storage.from('product-images').remove([record.image_path]);
	return NextResponse.json({ success: true });
}