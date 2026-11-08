import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const allowedTypes = new Map([
	['image/jpeg', 'jpg'],
	['image/png', 'png'],
	['image/webp', 'webp'],
]);
const maxFileSize = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
	if (user.app_metadata?.role !== 'admin') return NextResponse.json({ error: 'Akun ini tidak memiliki akses admin.' }, { status: 403 });
	if (!supabase) return NextResponse.json({ error: 'Storage admin belum dikonfigurasi.' }, { status: 503 });

	const formData = await request.formData();
	const file = formData.get('file');
	if (!(file instanceof File)) return NextResponse.json({ error: 'Pilih foto yang ingin diunggah.' }, { status: 400 });
	const extension = allowedTypes.get(file.type);
	if (!extension) return NextResponse.json({ error: 'Format foto harus JPG, PNG, atau WebP.' }, { status: 400 });
	if (file.size === 0 || file.size > maxFileSize) return NextResponse.json({ error: 'Ukuran foto maksimal 50 MB.' }, { status: 400 });

	const path = `homepage/${randomUUID()}.${extension}`;
	const { error } = await supabase.storage.from('product-images').upload(path, Buffer.from(await file.arrayBuffer()), {
		contentType: file.type,
		cacheControl: '3600',
		upsert: false,
	});
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	const { data } = supabase.storage.from('product-images').getPublicUrl(path);
	return NextResponse.json({ image_url: data.publicUrl, image_path: path });
}