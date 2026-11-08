import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

function escapeHtml(value: string) {
	return value.replace(/[&<>"']/g, character => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
	})[character] ?? character);
}

function formatIDR(value: number) {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0,
	}).format(value);
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
	if (user.app_metadata?.role !== 'admin') {
		return NextResponse.json({ error: 'Akun ini tidak memiliki akses admin.' }, { status: 403 });
	}
	if (!supabase) return NextResponse.json({ error: 'Database belum dikonfigurasi.' }, { status: 503 });
	const client = supabase;

	const gmailUser = process.env.GMAIL_USER;
	const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
	if (!gmailUser || !gmailAppPassword) {
		return NextResponse.json({ error: 'Pengiriman invoice belum dikonfigurasi. Atur GMAIL_USER dan GMAIL_APP_PASSWORD di Vercel.' }, { status: 503 });
	}

	const { id } = await params;
	const { data: order, error: orderError } = await client
		.from('orders')
		.select('id,order_number,customer_name,email,address,status,total_estimate,invoice_status')
		.eq('id', id)
		.maybeSingle();
	if (orderError) return NextResponse.json({ error: 'Data pesanan gagal dimuat.' }, { status: 500 });
	if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
	if (order.status === 'Dibatalkan') return NextResponse.json({ error: 'Invoice tidak dapat dikirim untuk pesanan yang dibatalkan.' }, { status: 409 });
	if (order.invoice_status === 'sent') return NextResponse.json({ error: 'Invoice pesanan ini sudah pernah dikirim.' }, { status: 409 });
	if (order.invoice_status === 'sending') return NextResponse.json({ error: 'Invoice sedang diproses. Muat ulang sebelum mencoba lagi.' }, { status: 409 });
	const catalogTotal = Number(order.total_estimate);
	if (!Number.isFinite(catalogTotal) || catalogTotal <= 0 || catalogTotal > 999999999999) {
		return NextResponse.json({ error: 'Total harga katalog pada pesanan tidak valid.' }, { status: 400 });
	}
	const previousStatus = order.status;

	const { data: claimedOrder, error: claimError } = await client
		.from('orders')
		.update({
			final_total: catalogTotal,
			status: 'Menunggu pembayaran',
			invoice_status: 'sending',
		})
		.eq('id', id)
		.eq('invoice_status', order.invoice_status)
		.select('id')
		.maybeSingle();
	if (claimError) return NextResponse.json({ error: 'Harga final gagal disimpan. Pastikan migrasi invoice sudah dijalankan.' }, { status: 500 });
	if (!claimedOrder) return NextResponse.json({ error: 'Pesanan sedang diperbarui. Muat ulang lalu coba lagi.' }, { status: 409 });

	async function markInvoiceFailed() {
		const { error } = await client
			.from('orders')
			.update({ invoice_status: 'failed', status: previousStatus })
			.eq('id', id)
			.eq('invoice_status', 'sending');
		if (error) console.error('Failed to restore order after invoice send failure:', error);
	}

	const { data: items, error: itemsError } = await client
		.from('order_items')
		.select('product_name,specification,quantity,unit_price_estimate')
		.eq('order_id', id);
	if (itemsError) {
		await markInvoiceFailed();
		return NextResponse.json({ error: 'Rincian produk invoice gagal dimuat.' }, { status: 500 });
	}

	const customerName = escapeHtml(order.customer_name);
	const orderNumber = escapeHtml(order.order_number);
	const address = escapeHtml(order.address);
	const totalText = formatIDR(catalogTotal);
	const itemRows = (items ?? []).map(item => {
		const quantity = Number(item.quantity);
		return `<tr>
			<td style="padding:12px;border-bottom:1px solid #e2e8f0">${escapeHtml(item.product_name)}<br><span style="color:#64748b;font-size:12px">${escapeHtml(item.specification)}</span></td>
			<td style="padding:12px;text-align:center;border-bottom:1px solid #e2e8f0">${quantity}</td>
		</tr>`;
	}).join('');
	const textItems = (items ?? []).map(item =>
		`- ${item.product_name} (${item.specification}) x${item.quantity}`,
	).join('\n');
	const text = [
		`Invoice APRINTZ - ${order.order_number}`,
		`Pelanggan: ${order.customer_name}`,
		`Alamat: ${order.address}`,
		'',
		'Rincian pesanan:',
		textItems,
		'',
		`Total pembayaran: ${totalText}`,
		`Catatan: Total menggunakan harga katalog website yang tercatat saat pesanan dibuat.`,
		'Metode pembayaran: QRIS. Silakan ikuti petunjuk pembayaran dari admin.',
	].join('\n');
	const html = `<!doctype html>
		<html lang="id">
		<body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b">
			<div style="max-width:640px;margin:32px auto;background:#fff;padding:32px">
				<p style="margin:0;color:#2563eb;font-weight:bold;letter-spacing:2px">APRINTZ</p>
				<h1 style="margin:12px 0 4px;color:#12345b;font-size:24px">Invoice Pesanan</h1>
				<p style="margin:0;color:#64748b">${orderNumber}</p>
				<hr style="margin:24px 0;border:0;border-top:1px solid #e2e8f0">
				<p>Halo ${customerName}, berikut invoice berdasarkan harga katalog website yang tercatat saat pesanan dibuat.</p>
				<p style="color:#475569"><b>Alamat:</b> ${address}</p>
				<table style="width:100%;border-collapse:collapse;font-size:14px">
					<thead><tr style="color:#64748b;text-align:left">
						<th style="padding:10px 12px">Produk</th><th style="padding:10px 12px;text-align:center">Jumlah</th>
					</tr></thead>
					<tbody>${itemRows}</tbody>
				</table>
				<div style="margin-top:20px;text-align:right">
					<span style="color:#64748b">Total pembayaran</span>
					<strong style="display:block;margin-top:4px;color:#12345b;font-size:22px">${totalText}</strong>
				</div>
				<div style="margin-top:24px;padding:16px;background:#eff6ff;color:#1e3a8a;font-size:14px;line-height:1.6">
					Metode pembayaran: <b>QRIS</b>. Silakan ikuti petunjuk pembayaran dari admin. Invoice ini bukan bukti pembayaran.
				</div>
				<p style="margin:24px 0 0;color:#64748b;font-size:12px">Terima kasih telah memesan di APRINTZ.</p>
			</div>
		</body>
		</html>`;

	try {
		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				user: gmailUser,
				pass: gmailAppPassword,
			},
		});
		await transporter.sendMail({
			from: `APRINTZ <${gmailUser}>`,
			to: order.email,
			subject: `Invoice APRINTZ ${order.order_number}`,
			html,
			text,
		});
	} catch (error) {
		console.error('Invoice Gmail delivery failed:', error);
		await markInvoiceFailed();
		return NextResponse.json({ error: 'Email invoice gagal dikirim. Pastikan App Password Google dan alamat Gmail sudah benar.' }, { status: 502 });
	}

	const { error: sentError } = await client
		.from('orders')
		.update({ invoice_status: 'sent', invoice_sent_at: new Date().toISOString() })
		.eq('id', id)
		.eq('invoice_status', 'sending');
	if (sentError) {
		console.error('Invoice email sent but order invoice status could not be saved:', sentError);
		return NextResponse.json({ error: 'Email invoice sudah terkirim, tetapi statusnya gagal disimpan. Hubungi admin sebelum mencoba mengirim ulang.' }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}
