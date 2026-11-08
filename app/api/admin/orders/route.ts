import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
	if (user.app_metadata?.role !== 'admin') {
		return NextResponse.json({ error: 'Akun ini tidak memiliki akses admin.' }, { status: 403 });
	}
	if (!supabase) return NextResponse.json({ error: 'Database belum dikonfigurasi.' }, { status: 503 });

	const url = new URL(request.url);
	const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
	const status = url.searchParams.get('status') ?? 'all';
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');

	const allOrders: any[] = [];
	for (let offset = 0; ; offset += 1000) {
		const { data, error } = await supabase
			.from('orders')
			.select('id,order_number,customer_name,email,phone,address,status,total_estimate,created_at,notes,admin_notes,shipping_courier,tracking_number,shipped_at')
			.order('created_at', { ascending: false })
			.range(offset, offset + 999);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		allOrders.push(...(data ?? []));
		if (!data || data.length < 1000) break;
	}

	const filteredOrders = allOrders.filter(order => {
		const matchesQ = !q || [order.order_number, order.customer_name, order.email, order.phone].some(value => String(value ?? '').toLowerCase().includes(q));
		const matchesStatus = status === 'all' || order.status === status;
		const createdAt = order.created_at ? new Date(order.created_at) : null;
		const matchesFrom = !from || !createdAt || createdAt >= new Date(from);
		const matchesTo = !to || !createdAt || createdAt <= new Date(`${to}T23:59:59`);
		return matchesQ && matchesStatus && matchesFrom && matchesTo;
	});

	if (url.searchParams.get('format') === 'csv') {
		const csvCell = (value: unknown) => {
			let text = String(value ?? '');
			if (/^[\t\r=+\-@]/.test(text)) text = `'${text}`;
			return `"${text.replace(/"/g, '""')}"`;
		};
		const rows = [
			['Nomor order', 'Tanggal', 'Pelanggan', 'Email', 'Telepon', 'Alamat', 'Status', 'Total estimasi', 'Catatan pelanggan', 'Catatan internal'],
			...filteredOrders.map(order => [
				order.order_number,
				order.created_at,
				order.customer_name,
				order.email,
				order.phone,
				order.address,
				order.status,
				Number(order.total_estimate || 0),
				order.notes,
				order.admin_notes,
			]),
		];
		const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`;
		return new NextResponse(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="aprintz-orders.csv"',
				'Cache-Control': 'no-store',
			},
		});
	}

	const reviewStatuses = new Set(['Menunggu konfirmasi', 'Menunggu pembayaran', 'Pembayaran berhasil', 'Proses desain', 'Menunggu persetujuan desain']);
	const activeOrders = filteredOrders.filter(order => order.status !== 'Dibatalkan' && order.status !== 'Selesai');
	const recentOrders = filteredOrders.slice(0, 200);

	const weekStart = new Date();
	weekStart.setHours(0, 0, 0, 0);
	weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
	const weekly = Array.from({ length: 6 }, (_, index) => {
		const start = new Date(weekStart);
		start.setDate(start.getDate() - (5 - index) * 7);
		const end = new Date(start);
		end.setDate(end.getDate() + 7);
		return { label: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(start), value: 0, start, end };
	});

	for (const order of filteredOrders) {
		const createdAt = new Date(order.created_at).getTime();
		const bucket = weekly.find(item => createdAt >= item.start.getTime() && createdAt < item.end.getTime());
		if (bucket) bucket.value += Number(order.total_estimate || 0);
	}

	const stats = {
		totalOrders: filteredOrders.length,
		totalRevenue: filteredOrders.reduce((sum, order) => sum + Number(order.total_estimate || 0), 0),
		reviewCount: filteredOrders.filter(order => reviewStatuses.has(order.status)).length,
		activeCount: activeOrders.length,
		completedCount: filteredOrders.filter(order => order.status === 'Selesai').length,
		cancelledCount: filteredOrders.filter(order => order.status === 'Dibatalkan').length,
		productionCount: filteredOrders.filter(order => ['Dalam produksi', 'Quality control', 'Siap dikirim/diambil', 'Dalam pengiriman', 'Proses desain'].includes(order.status)).length,
		customerCount: new Set(filteredOrders.map(order => String(order.email ?? '').toLowerCase()).filter(Boolean)).size,
		estimatedValue: activeOrders.reduce((sum, order) => sum + Number(order.total_estimate || 0), 0),
		weekly: weekly.map(({ label, value }) => ({ label, value })),
	};

	return NextResponse.json({
		orders: recentOrders,
		stats,
	});
}
