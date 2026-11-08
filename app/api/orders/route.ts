import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const schema = z.object({
	name: z.string().trim().min(2).max(120),
	email: z.string().email().max(254),
	phone: z.string().trim().min(8).max(32),
	address: z.string().trim().min(5).max(1000),
	notes: z.string().max(2000).optional(),
	items: z.array(z.object({
		slug: z.string().trim().min(1).max(120),
		variantId: z.string().uuid().optional(),
		option: z.string().trim().min(1).max(200),
		qty: z.number().int().positive().max(100000),
		note: z.string().max(1000).optional(),
		designUrl: z.string().url().max(1000).regex(/^https?:\/\//i).optional(),
	})).min(1).max(50),
});

const designTypes = new Map<string, { contentType: string; aliases: string[] }>([
	['pdf', { contentType: 'application/pdf', aliases: ['application/pdf'] }],
	['png', { contentType: 'image/png', aliases: ['image/png'] }],
	['jpg', { contentType: 'image/jpeg', aliases: ['image/jpeg'] }],
	['jpeg', { contentType: 'image/jpeg', aliases: ['image/jpeg'] }],
	['webp', { contentType: 'image/webp', aliases: ['image/webp'] }],
	['svg', { contentType: 'image/svg+xml', aliases: ['image/svg+xml'] }],
	['ai', { contentType: 'application/postscript', aliases: ['application/postscript', 'application/illustrator'] }],
	['cdr', { contentType: 'application/vnd.corel-draw', aliases: ['application/vnd.corel-draw', 'application/x-cdr'] }],
	['psd', { contentType: 'image/vnd.adobe.photoshop', aliases: ['image/vnd.adobe.photoshop', 'application/vnd.adobe.photoshop'] }],
	['zip', { contentType: 'application/zip', aliases: ['application/zip', 'application/x-zip-compressed'] }],
	['rar', { contentType: 'application/vnd.rar', aliases: ['application/vnd.rar', 'application/x-rar-compressed'] }],
]);
const maxDesignSize = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
	try {
		let body: unknown;
		let designFiles: File[] = [];
		if (req.headers.get('content-type')?.includes('multipart/form-data')) {
			const formData = await req.formData();
			let items: unknown;
			try {
				items = JSON.parse(String(formData.get('items') ?? ''));
			} catch {
				return NextResponse.json({ error: 'Daftar produk tidak valid.' }, { status: 400 });
			}
			body = {
				name: formData.get('name'),
				email: formData.get('email'),
				phone: formData.get('phone'),
				address: formData.get('address'),
				notes: formData.get('notes') || undefined,
				items,
			};
			const uploadedFile = formData.get('design');
			if (uploadedFile instanceof File && uploadedFile.size > 0) designFiles.push(uploadedFile);
			designFiles = designFiles.concat(formData.getAll('designFiles').filter((file): file is File => file instanceof File && file.size > 0));
		} else {
			body = await req.json();
		}

		const parsed = schema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: 'Data pesanan belum lengkap atau tidak valid.' }, { status: 400 });
		}
		const validatedDesignFiles = designFiles.map(file => {
			const extension = file.name.split('.').pop()?.toLowerCase();
			return { file, extension, type: extension ? designTypes.get(extension) : undefined };
		});
		if (validatedDesignFiles.some(({ file, type }) => !type || (file.type && file.type !== 'application/octet-stream' && !type.aliases.includes(file.type)))) {
			return NextResponse.json({ error: 'Format desain harus PDF, AI, CDR, PSD, JPG, PNG, ZIP, atau RAR.' }, { status: 400 });
		}
		if (validatedDesignFiles.some(({ file }) => file.size === 0 || file.size > maxDesignSize)) {
			return NextResponse.json({ error: 'Ukuran file desain maksimal 50 MB per file.' }, { status: 400 });
		}
		if (!supabase) {
			return NextResponse.json({ error: 'Database belum dikonfigurasi.' }, { status: 503 });
		}

		const details = parsed.data;
		const slugs = [...new Set(details.items.map(item => item.slug))];
		const { data: catalog, error: catalogError } = await supabase
			.from('products')
			.select('id,slug,name,base_price,is_active')
			.in('slug', slugs);
		if (catalogError) throw catalogError;

		const catalogBySlug = new Map((catalog ?? []).map(product => [product.slug, product]));
		const productIds = (catalog ?? []).map(product => product.id);
		const { data: variants, error: variantError } = productIds.length
			? await supabase
					.from('product_variants')
					.select('id,product_id,name,unit_price,min_quantity')
					.in('product_id', productIds)
					.eq('is_active', true)
			: { data: [], error: null };
		if (variantError && variantError.code !== 'PGRST205' && variantError.code !== '42P01') throw variantError;

		const pricedItems = details.items.map(item => {
			const product = catalogBySlug.get(item.slug);
			if (!product || !product.is_active) return null;
			const productVariants = (variants ?? []).filter(variant => variant.product_id === product.id);
			const selectedVariant = item.variantId
				? productVariants.find(variant => variant.id === item.variantId)
				: undefined;
			if (item.variantId && !selectedVariant) return null;
			if (productVariants.length && !selectedVariant) return null;
			if (selectedVariant && item.qty < selectedVariant.min_quantity) return null;
			const unitPrice = Number(selectedVariant?.unit_price ?? product.base_price);
			if (!Number.isFinite(unitPrice) || unitPrice < 0) return null;
			return { item, product, selectedVariant, unitPrice };
		});
		if (pricedItems.some(item => item === null)) {
			return NextResponse.json({ error: 'Salah satu produk tidak tersedia. Perbarui keranjang lalu coba lagi.' }, { status: 400 });
		}

		const validItems = pricedItems.filter((item): item is NonNullable<typeof item> => item !== null);
		const orderNumber = `APR-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
		const totalEstimate = validItems.reduce((sum, { item, unitPrice }) => sum + item.qty * unitPrice, 0);
		if (!Number.isFinite(totalEstimate)) {
			return NextResponse.json({ error: 'Total pesanan tidak valid.' }, { status: 400 });
		}

		const { data: order, error: orderError } = await supabase
			.from('orders')
			.insert({
				order_number: orderNumber,
				customer_name: details.name,
				email: details.email,
				phone: details.phone,
				address: details.address,
				notes: details.notes,
				status: 'Menunggu konfirmasi',
				total_estimate: totalEstimate,
			})
			.select()
			.single();
		if (orderError) throw orderError;

		const lines = validItems.map(({ item, product, selectedVariant, unitPrice }) => ({
			order_id: order.id,
			product_id: product.id,
			product_name: product.name,
			specification: selectedVariant?.name ?? item.option,
			quantity: item.qty,
			unit_price_estimate: unitPrice,
			note: item.note,
			design_url: item.designUrl,
		}));
		let { error: lineError } = await supabase.from('order_items').insert(lines);
		const missingDesignUrlColumn = lineError?.code === 'PGRST204' && /design_url/i.test(lineError.message);
		if (missingDesignUrlColumn) {
			const compatibleLines = validItems.map(({ item, product, selectedVariant, unitPrice }) => ({
				order_id: order.id,
				product_id: product.id,
				product_name: product.name,
				specification: selectedVariant?.name ?? item.option,
				quantity: item.qty,
				unit_price_estimate: unitPrice,
				note: [item.note, item.designUrl ? `Link desain: ${item.designUrl}` : ''].filter(Boolean).join('\n') || undefined,
			}));
			const retry = await supabase.from('order_items').insert(compatibleLines);
			lineError = retry.error;
		}
		if (lineError) {
			const { error: rollbackError } = await supabase.from('orders').delete().eq('id', order.id);
			if (rollbackError) console.error('Failed to remove incomplete order:', rollbackError);
			throw lineError;
		}

		const uploadedPaths: string[] = [];
		for (const { file, extension, type } of validatedDesignFiles) {
			const storagePath = `${order.id}/${randomBytes(12).toString('hex')}.${extension}`;
			const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-160) || `design.${extension}`;
			const { error: uploadError } = await supabase.storage
				.from('order-designs')
				.upload(storagePath, Buffer.from(await file.arrayBuffer()), {
					contentType: type!.contentType,
					cacheControl: '3600',
					upsert: false,
				});
			if (uploadError) {
				if (uploadedPaths.length) {
					const { error: cleanupError } = await supabase.storage.from('order-designs').remove(uploadedPaths);
					if (cleanupError) console.error('Failed to remove uploaded design files after failure:', cleanupError);
				}
				const { error: rollbackError } = await supabase.from('orders').delete().eq('id', order.id);
				if (rollbackError) console.error('Failed to remove order after design upload failure:', rollbackError);
				const message = uploadError.message.includes('bucket') || uploadError.message.toLowerCase().includes('not found')
					? 'Bucket order-designs belum dibuat di Supabase. Jalankan schema SQL di Supabase untuk membuat bucket storage.'
					: 'File desain gagal disimpan. Pastikan bucket order-designs sudah dibuat.';
				return NextResponse.json({ error: message }, { status: 503 });
			}
			uploadedPaths.push(storagePath);

			const { error: designError } = await supabase.from('order_designs').insert({
				order_id: order.id,
				storage_path: storagePath,
				original_file_name: safeFileName,
				content_type: type!.contentType,
				file_size: file.size,
			});
			if (designError) {
				const { error: cleanupError } = await supabase.storage.from('order-designs').remove(uploadedPaths);
				if (cleanupError) console.error('Failed to remove uploaded design files after record failure:', cleanupError);
				const { error: rollbackError } = await supabase.from('orders').delete().eq('id', order.id);
				if (rollbackError) console.error('Failed to remove order after design record failure:', rollbackError);
				throw designError;
			}
		}

		return NextResponse.json({ order }, { status: 201 });
	} catch (error) {
		console.error('Create order failed:', error);
		return NextResponse.json({ error: 'Pesanan gagal disimpan. Coba lagi atau hubungi CS.' }, { status: 500 });
	}
}

export async function GET(req: NextRequest) {
	const code = req.nextUrl.searchParams.get('code');
	if (!code) return NextResponse.json({ error: 'Nomor pesanan wajib diisi.' }, { status: 400 });
	if (!supabase) return NextResponse.json({ error: 'Database belum dikonfigurasi.' }, { status: 503 });

	const { data, error } = await supabase
		.from('orders')
		.select('order_number,customer_name,status,created_at,shipping_courier,tracking_number,shipped_at')
		.eq('order_number', code)
		.maybeSingle();
	if (error || !data) return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
	return NextResponse.json({ order: data });
}
