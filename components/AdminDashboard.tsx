'use client';

import { useEffect, useState } from 'react';
import { BarChart3, ClipboardList, Download, Eye, Home, Mail, Package, Truck, Users, X } from 'lucide-react';
import { formatIDR } from '@/lib/products';
import AdminProducts from '@/components/AdminProducts';
import AdminManualOrder from '@/components/AdminManualOrder';
import AdminHomepageEditor from '@/components/AdminHomepageEditor';
import styles from './AdminDashboard.module.css';

type AdminTab = 'orders' | 'products' | 'customers' | 'shipping' | 'reports' | 'homepage';
type WorkView = 'urgent' | 'review' | 'production' | 'completed' | 'all';

type OrderItem = {
  id: string;
  product_name: string;
  specification: string;
  quantity: number;
  unit_price_estimate: number;
  note?: string | null;
  design_url?: string | null;
};

type OrderDesign = {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  reviewStatus: string;
  createdAt: string;
  previewUrl: string | null;
  downloadUrl: string | null;
};

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  total_estimate: number;
  final_total?: number | null;
  invoice_status?: string;
  invoice_sent_at?: string | null;
  created_at: string;
  notes?: string | null;
  admin_notes?: string | null;
  shipping_courier?: string | null;
  tracking_number?: string | null;
  shipped_at?: string | null;
  order_items?: OrderItem[];
  designs?: OrderDesign[];
};

type DashboardStats = {
  totalOrders: number;
  totalRevenue: number;
  reviewCount: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  productionCount: number;
  customerCount: number;
  estimatedValue: number;
  weekly: { label: string; value: number }[];
};

const statuses = [
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
];

const adminTabCopy: Record<AdminTab, { eyebrow: string; title: string; description: string }> = {
  orders: { eyebrow: 'ORDER MANAGEMENT', title: 'Pesanan', description: 'Pantau antrean, prioritas, status, dan detail produksi.' },
  products: { eyebrow: 'CATALOG MANAGEMENT', title: 'Produk & stok', description: 'Kelola katalog, harga, stok, dan foto produk.' },
  customers: { eyebrow: 'CUSTOMER DIRECTORY', title: 'Pelanggan', description: 'Lihat kontak, frekuensi order, dan nilai transaksi estimasi.' },
  shipping: { eyebrow: 'FULFILLMENT DESK', title: 'Pengiriman', description: 'Kelola order siap kirim, kurir, dan nomor resi.' },
  reports: { eyebrow: 'BUSINESS REPORTS', title: 'Laporan', description: 'Ringkasan order, nilai estimasi, dan distribusi status.' },
  homepage: { eyebrow: 'STOREFRONT CONTENT', title: 'Beranda', description: 'Atur banner promosi dan ulasan yang tampil di halaman utama.' },
};

const reviewStatuses = new Set([
  'Menunggu konfirmasi',
  'Menunggu pembayaran',
  'Pembayaran berhasil',
  'Proses desain',
  'Menunggu persetujuan desain',
]);
const productionStatuses = new Set(['Dalam produksi', 'Quality control', 'Siap dikirim/diambil', 'Dalam pengiriman']);

function getOrderAge(createdAt: string) {
  const hours = Math.max(0, (Date.now() - Date.parse(createdAt)) / 3_600_000);
  const ageLabel = hours >= 24 ? `${Math.floor(hours / 24)} hari` : `${Math.floor(hours)} jam`;
  if (hours >= 72) return { ageLabel, priorityLabel: 'Mendesak', priorityClass: 'bg-red-100 text-red-800' };
  if (hours >= 24) return { ageLabel, priorityLabel: 'Prioritas', priorityClass: 'bg-amber-100 text-amber-800' };
  return { ageLabel, priorityLabel: 'Normal', priorityClass: 'bg-emerald-100 text-emerald-800' };
}

function isUrgentOrder(order: Order) {
  return !['Selesai', 'Dibatalkan'].includes(order.status)
    && Date.now() - Date.parse(order.created_at) >= 24 * 60 * 60 * 1000;
}

function getStatusTone(status: string) {
  if (status === 'Selesai') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Dibatalkan') return 'bg-slate-100 text-slate-700';
  if (productionStatuses.has(status)) return 'bg-blue-100 text-blue-800';
  if (['Menunggu konfirmasi', 'Menunggu pembayaran', 'Menunggu persetujuan desain'].includes(status)) return 'bg-amber-100 text-amber-800';
  return 'bg-sky-100 text-sky-800';
}

function toLocalDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function CustomerDirectory({ orders, totalCustomers }: { orders: Order[]; totalCustomers: number }) {
  const grouped = new Map<string, { email: string; name: string; phone: string; orderCount: number; totalEstimate: number; lastOrderAt: string }>();
  for (const order of orders) {
    const key = order.email.toLowerCase();
    const customer = grouped.get(key);
    if (customer) {
      customer.orderCount += 1;
      customer.totalEstimate += Number(order.total_estimate || 0);
      if (Date.parse(order.created_at) > Date.parse(customer.lastOrderAt)) customer.lastOrderAt = order.created_at;
    } else {
      grouped.set(key, {
        email: order.email,
        name: order.customer_name,
        phone: order.phone,
        orderCount: 1,
        totalEstimate: Number(order.total_estimate || 0),
        lastOrderAt: order.created_at,
      });
    }
  }
  const customers = [...grouped.values()].sort((left, right) => Date.parse(right.lastOrderAt) - Date.parse(left.lastOrderAt));
  const returningCustomers = customers.filter(customer => customer.orderCount > 1).length;

  return (
    <div className="admin-submodule space-y-5">
      <section className="admin-kpis grid gap-3 sm:grid-cols-3">
        <article className="card p-4"><p className="text-xs font-bold uppercase text-slate-500">Pelanggan terdaftar</p><p className="mt-2 text-xl font-black text-[#12345b]">{totalCustomers}</p></article>
        <article className="card p-4"><p className="text-xs font-bold uppercase text-slate-500">Pelanggan berulang</p><p className="mt-2 text-xl font-black text-[#12345b]">{returningCustomers}</p></article>
        <article className="card p-4"><p className="text-xs font-bold uppercase text-slate-500">Order termuat</p><p className="mt-2 text-xl font-black text-[#12345b]">{orders.length}</p></article>
      </section>
      <section className="admin-queue card overflow-x-auto p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-bold text-[#12345b]">Direktori pelanggan</h2><p className="mt-1 text-xs text-slate-500">Dikelompokkan dari order terbaru yang termuat.</p></div>
          <span className="text-xs text-slate-500">{customers.length} pelanggan terlihat</span>
        </div>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="text-xs text-slate-500"><tr><th className="py-2">Nama</th><th>Kontak</th><th>Jumlah order</th><th>Nilai estimasi</th><th>Order terakhir</th></tr></thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.email} className="border-t border-slate-100">
                <td className="py-3 font-bold text-[#12345b]">{customer.name}</td>
                <td><span>{customer.email}</span><p className="text-xs text-slate-500">{customer.phone}</p></td>
                <td>{customer.orderCount}</td>
                <td>{formatIDR(customer.totalEstimate)}</td>
                <td>{new Date(customer.lastOrderAt).toLocaleDateString('id-ID')}</td>
              </tr>
            ))}
            {!customers.length && <tr><td className="py-6 text-slate-500" colSpan={5}>Belum ada data pelanggan.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function ShippingQueue({ orders, onOpenOrder }: { orders: Order[]; onOpenOrder: (orderId: string) => void }) {
  const shipments = orders.filter(order => ['Siap dikirim/diambil', 'Dalam pengiriman'].includes(order.status) || order.shipping_courier || order.tracking_number);

  return (
    <section className="admin-queue card overflow-x-auto p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-bold text-[#12345b]">Pengiriman & fulfillment</h2><p className="mt-1 text-xs text-slate-500">Order siap kirim, sedang dikirim, atau sudah memiliki data resi.</p></div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{shipments.length} pengiriman</span>
      </div>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs text-slate-500"><tr><th className="py-2">Order</th><th>Penerima</th><th>Kurir</th><th>Resi</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {shipments.map(order => (
            <tr key={order.id} className="border-t border-slate-100">
              <td className="py-3"><button onClick={() => onOpenOrder(order.id)} className="font-bold text-[#1769d2] underline">{order.order_number}</button></td>
              <td><b>{order.customer_name}</b><p className="text-xs text-slate-500">{order.phone}</p></td>
              <td>{order.shipping_courier || 'Belum diisi'}</td>
              <td className="font-mono text-xs">{order.tracking_number || 'Belum diisi'}</td>
              <td><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusTone(order.status)}`}>{order.status}</span></td>
              <td><button onClick={() => onOpenOrder(order.id)} className="text-xs font-bold text-[#1769d2]">Buka detail</button></td>
            </tr>
          ))}
          {!shipments.length && <tr><td className="py-6 text-slate-500" colSpan={6}>Belum ada order dalam antrean pengiriman.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}

function AdminReports({ orders, stats, exportUrl }: { orders: Order[]; stats: DashboardStats | null; exportUrl: string }) {
  const weekly = stats?.weekly ?? [];
  const maxWeekly = Math.max(...weekly.map(week => week.value), 1);
  const statusCounts = statuses.map(status => ({ status, count: orders.filter(order => order.status === status).length }));
  const maxStatus = Math.max(...statusCounts.map(item => item.count), 1);

  return (
    <div className="admin-submodule space-y-5">
      <section className="admin-kpis grid gap-3 sm:grid-cols-3">
        <article className="card p-4"><p className="text-xs font-bold uppercase text-slate-500">Order</p><p className="mt-2 text-xl font-black text-[#12345b]">{stats?.totalOrders ?? 0}</p></article>
        <article className="card p-4"><p className="text-xs font-bold uppercase text-slate-500">Nilai estimasi</p><p className="mt-2 text-xl font-black text-[#12345b]">{formatIDR(stats?.totalRevenue ?? 0)}</p></article>
        <article className="card p-4"><p className="text-xs font-bold uppercase text-slate-500">Order aktif</p><p className="mt-2 text-xl font-black text-[#12345b]">{stats?.activeCount ?? 0}</p></article>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-[#12345b]">Nilai order mingguan</h2><p className="mt-1 text-xs text-slate-500">Enam minggu terakhir · estimasi, bukan pembayaran terverifikasi</p></div><a href={exportUrl} className="btn btn-outline inline-flex items-center gap-2"><Download size={15} /> CSV</a></div>
          <div className="mt-5 grid h-44 grid-cols-6 items-end gap-3" aria-label="Grafik nilai order mingguan">
            {weekly.map(week => <div key={week.label} className="flex h-full flex-col items-center justify-end gap-2"><div className="w-full rounded-t bg-brand-600" style={{ height: `${Math.max(week.value > 0 ? 8 : 2, week.value / maxWeekly * 100)}%` }} title={formatIDR(week.value)} /><span className="text-[10px] text-slate-500">{week.label}</span></div>)}
          </div>
        </div>
        <div className="card p-4">
          <h2 className="font-bold text-[#12345b]">Distribusi status</h2>
          <div className="mt-4 space-y-3">
            {statusCounts.filter(item => item.count > 0).map(item => <div key={item.status}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate text-slate-600">{item.status}</span><b>{item.count}</b></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(6, item.count / maxStatus * 100)}%` }} /></div></div>)}
            {!orders.length && <p className="text-sm text-slate-500">Belum ada data status.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [workView, setWorkView] = useState<WorkView>('review');
  const [preview, setPreview] = useState<OrderDesign | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [designsReady, setDesignsReady] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [adminNotesDraft, setAdminNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notice, setNotice] = useState('');
  const [shippingCourierDraft, setShippingCourierDraft] = useState('');
  const [trackingNumberDraft, setTrackingNumberDraft] = useState('');
  const [shippedAtDraft, setShippedAtDraft] = useState('');
  const [savingShipping, setSavingShipping] = useState(false);
  const [finalTotalDraft, setFinalTotalDraft] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);

  async function loadOrders() {
    setBusy(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    const response = await fetch(`/api/admin/orders${params.toString() ? `?${params.toString()}` : ''}`);
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Tidak dapat memuat pesanan.');
    else {
      setOrders(data.orders);
      setStats(data.stats);
      setDesignsReady(data.designsReady ?? true);
      setError('');
      if (data.orders.length && (!selectedOrderId || !data.orders.some((order: Order) => order.id === selectedOrderId))) {
        setSelectedOrderId(data.orders[0].id);
      }
    }
    setBusy(false);
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  async function updateStatus(orderId: string, status: string) {
    const previousOrder = orders.find(order => order.id === orderId);
    if (!previousOrder) return;

    const applyStatus = (nextStatus: string) => {
      setOrders(current => current.map(order => order.id === orderId ? { ...order, status: nextStatus } : order));
      setSelectedOrderDetail(current => current?.id === orderId ? { ...current, status: nextStatus } : current);
    };

    setStatusSavingId(orderId);
    setError('');
    setNotice(`Status ${previousOrder.order_number} diubah ke ${status}.`);
    applyStatus(status);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Status pesanan gagal diperbarui.');
      applyStatus(data.order.status);
      void loadOrders();
    } catch (updateError) {
      applyStatus(previousOrder.status);
      setNotice('');
      setError(updateError instanceof Error ? updateError.message : 'Status pesanan gagal diperbarui.');
    } finally {
      setStatusSavingId(null);
    }
  }

  const visibleOrders = orders
    .filter(order => {
      if (workView === 'urgent') return isUrgentOrder(order);
      if (workView === 'review') return reviewStatuses.has(order.status);
      if (workView === 'production') return productionStatuses.has(order.status);
      if (workView === 'completed') return ['Selesai', 'Dibatalkan'].includes(order.status);
      return true;
    })
    .sort((left, right) => {
      if (workView === 'completed') return Date.parse(right.created_at) - Date.parse(left.created_at);
      return Date.parse(left.created_at) - Date.parse(right.created_at);
    });

  const selectedOrderSummary = orders.find(order => order.id === selectedOrderId) ?? visibleOrders[0] ?? null;
  const selectedOrder = selectedOrderDetail?.id === selectedOrderSummary?.id ? selectedOrderDetail : selectedOrderSummary;
  const urgentCount = orders.filter(isUrgentOrder).length;

  useEffect(() => {
    const orderId = selectedOrderSummary?.id;
    if (!orderId) {
      setSelectedOrderDetail(null);
      setDetailBusy(false);
      return;
    }

    let active = true;
    setSelectedOrderDetail(null);
    setDetailBusy(true);
    void fetch(`/api/admin/orders/${orderId}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Detail order gagal dimuat.');
        return data.order as Order;
      })
      .then(order => {
        if (active) setSelectedOrderDetail(order);
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Detail order gagal dimuat.');
      })
      .finally(() => {
        if (active) setDetailBusy(false);
      });

    return () => {
      active = false;
    };
  }, [selectedOrderSummary?.id]);

  useEffect(() => {
    setAdminNotesDraft(selectedOrder?.admin_notes ?? '');
  }, [selectedOrder?.id, selectedOrder?.admin_notes]);

  useEffect(() => {
    setShippingCourierDraft(selectedOrder?.shipping_courier ?? '');
    setTrackingNumberDraft(selectedOrder?.tracking_number ?? '');
    setShippedAtDraft(toLocalDateTime(selectedOrder?.shipped_at));
  }, [selectedOrder?.id, selectedOrder?.shipping_courier, selectedOrder?.tracking_number, selectedOrder?.shipped_at]);

  useEffect(() => {
    setFinalTotalDraft(selectedOrder?.final_total == null ? '' : String(selectedOrder.final_total));
  }, [selectedOrder?.id, selectedOrder?.final_total]);

  const exportParams = new URLSearchParams();
  if (search.trim()) exportParams.set('q', search.trim());
  if (statusFilter !== 'all') exportParams.set('status', statusFilter);
  if (fromDate) exportParams.set('from', fromDate);
  if (toDate) exportParams.set('to', toDate);
  exportParams.set('format', 'csv');
  const exportUrl = `/api/admin/orders?${exportParams.toString()}`;

  function applyFilters() {
    void loadOrders();
  }

  async function saveAdminNotes() {
    if (!selectedOrder) return;
    setSavingNotes(true);
    setNotice('');
    const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: adminNotesDraft }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Catatan internal gagal disimpan.');
    else {
      setError('');
      setNotice('Catatan internal tersimpan.');
      await loadOrders();
    }
    setSavingNotes(false);
  }

  async function saveShippingDetails() {
    if (!selectedOrder) return;
    setSavingShipping(true);
    setNotice('');
    const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shipping_courier: shippingCourierDraft.trim() || null,
        tracking_number: trackingNumberDraft.trim() || null,
        shipped_at: shippedAtDraft ? new Date(shippedAtDraft).toISOString() : null,
      }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Informasi pengiriman gagal disimpan.');
    else {
      setError('');
      setNotice('Informasi pengiriman tersimpan.');
      await loadOrders();
    }
    setSavingShipping(false);
  }

  async function sendInvoice() {
    if (!selectedOrder) return;
    const finalTotal = Number(finalTotalDraft);
    if (!Number.isFinite(finalTotal) || finalTotal <= 0) {
      setError('Masukkan harga final invoice yang valid.');
      return;
    }

    setSendingInvoice(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalTotal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invoice gagal dikirim.');
      setNotice(`Invoice ${selectedOrder.order_number} berhasil dikirim ke ${selectedOrder.email}.`);
      await loadOrders();
      const detailResponse = await fetch(`/api/admin/orders/${selectedOrder.id}`);
      const detailData = await detailResponse.json();
      if (!detailResponse.ok) throw new Error(detailData.error || 'Invoice terkirim, tetapi detail order gagal dimuat ulang.');
      setSelectedOrderDetail(detailData.order);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Invoice gagal dikirim.');
    } finally {
      setSendingInvoice(false);
    }
  }

  function openOrderFromShipping(orderId: string) {
    setActiveTab('orders');
    setWorkView('all');
    setSelectedOrderId(orderId);
  }

  return (
    <main className={`${styles.theme} admin-shell min-h-[75vh]`}>
      <div className="admin-layout mx-auto grid max-w-[1480px] gap-7 px-4 py-7 md:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
        <aside className="admin-rail self-start border-b border-slate-200 pb-5 lg:sticky lg:top-28 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
          <div className="admin-brand-lockup">
            <span className="admin-brand-mark">A/</span>
            <span><b>APRINTZ</b><small>PRODUCTION DESK</small></span>
          </div>
          <p className="admin-rail-title">Panel admin</p>
          <nav aria-label="Menu administrasi" className="mt-5 flex flex-wrap gap-2 overflow-x-auto lg:grid lg:gap-1">
            <button
              onClick={() => setActiveTab('orders')}
              aria-current={activeTab === 'orders' ? 'page' : undefined}
              className={`flex min-w-0 shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${activeTab === 'orders' ? 'bg-[#12345b] text-white' : 'text-slate-600 hover:bg-white'}`}
            >
              <span className="flex items-center gap-2"><ClipboardList size={16} /> Pesanan</span>
              <span className={`rounded px-2 py-0.5 text-xs ${activeTab === 'orders' ? 'bg-white/15' : 'bg-amber-100 text-amber-800'}`}>{stats?.reviewCount ?? 0}</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              aria-current={activeTab === 'products' ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${activeTab === 'products' ? 'bg-[#12345b] text-white' : 'text-slate-600 hover:bg-white'}`}
            ><Package size={16} /> Produk & stok
            </button>
            <button onClick={() => setActiveTab('customers')} aria-current={activeTab === 'customers' ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${activeTab === 'customers' ? 'bg-[#12345b] text-white' : 'text-slate-600 hover:bg-white'}`}>
              <Users size={16} /> Pelanggan
            </button>
            <button onClick={() => setActiveTab('shipping')} aria-current={activeTab === 'shipping' ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${activeTab === 'shipping' ? 'bg-[#12345b] text-white' : 'text-slate-600 hover:bg-white'}`}>
              <Truck size={16} /> Pengiriman
            </button>
            <button onClick={() => setActiveTab('reports')} aria-current={activeTab === 'reports' ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${activeTab === 'reports' ? 'bg-[#12345b] text-white' : 'text-slate-600 hover:bg-white'}`}>
              <BarChart3 size={16} /> Laporan
            </button>
            <button onClick={() => setActiveTab('homepage')} aria-current={activeTab === 'homepage' ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${activeTab === 'homepage' ? 'bg-[#12345b] text-white' : 'text-slate-600 hover:bg-white'}`}>
              <Home size={16} /> Beranda
            </button>
          </nav>
          <div className="mt-7 hidden border-t border-slate-200 pt-5 lg:block">
            <p className="text-xs font-bold text-slate-500">PEMBAYARAN</p>
            <p className="mt-2 text-sm font-bold text-amber-700">Belum terhubung</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Status order bukan bukti pembayaran atau saldo.</p>
          </div>
        </aside>

        <section className="admin-content min-w-0">
          <header className="admin-page-header mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="eyebrow">{adminTabCopy[activeTab].eyebrow}</p>
              <h1 className="mt-2 text-3xl font-black text-[#12345b]">{adminTabCopy[activeTab].title}</h1>
              <p className="mt-1 text-sm text-slate-500">{adminTabCopy[activeTab].description}</p>
            </div>
            <button onClick={() => void loadOrders()} disabled={busy} className="btn btn-outline disabled:opacity-50">{busy ? 'Memuat...' : 'Segarkan data'}</button>
          </header>

          {activeTab === 'products' ? <AdminProducts />
            : activeTab === 'homepage' ? <AdminHomepageEditor />
            : activeTab === 'customers' ? <CustomerDirectory orders={orders} totalCustomers={stats?.customerCount ?? 0} />
              : activeTab === 'shipping' ? <ShippingQueue orders={orders} onOpenOrder={openOrderFromShipping} />
                : activeTab === 'reports' ? <AdminReports orders={orders} stats={stats} exportUrl={exportUrl} />
                  : <>
      {error && <p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}

      <section className="admin-kpis mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="card p-5">
          <p className="text-sm text-slate-500">Total omzet</p>
          <p className="mt-2 text-2xl font-black text-[#12345b]">{busy ? '...' : formatIDR(stats?.totalRevenue ?? 0)}</p>
        </article>
        <article className="card p-5 border-amber-200">
          <p className="text-sm text-slate-500">Pesanan baru</p>
          <p className="mt-2 text-2xl font-black text-amber-700">{busy ? '...' : stats?.reviewCount ?? 0}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-slate-500">Dalam produksi</p>
          <p className="mt-2 text-2xl font-black text-[#12345b]">{busy ? '...' : stats?.productionCount ?? 0}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-slate-500">Selesai</p>
          <p className="mt-2 text-2xl font-black text-[#12345b]">{busy ? '...' : stats?.completedCount ?? 0}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-slate-500">Pelanggan</p>
          <p className="mt-2 text-2xl font-black text-[#12345b]">{busy ? '...' : stats?.customerCount ?? 0}</p>
        </article>
      </section>

      <section className="admin-insights mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.8fr]">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-[#12345b]">Tren nilai order</h2>
              <p className="mt-1 text-xs text-slate-500">Ringkasan estimasi 6 minggu terakhir.</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">IDR</span>
          </div>
          <div className="mt-6 grid h-48 grid-cols-6 items-end gap-3" aria-label="Grafik nilai order mingguan">
            {(stats?.weekly ?? []).map(week => {
              const maxValue = Math.max(...(stats?.weekly.map(item => item.value) ?? [0]), 1);
              const height = Math.max(week.value > 0 ? 8 : 2, (week.value / maxValue) * 100);
              return (
                <div key={week.label} className="flex h-full flex-col items-center justify-end gap-2">
                  <div className="w-full rounded-t bg-brand-600" style={{ height: `${height}%` }} title={formatIDR(week.value)} />
                  <span className="text-[10px] text-slate-500">{week.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-[#12345b]">Ringkasan operasional</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-slate-500">Belum dibayar</span><b>{busy ? '...' : orders.filter(order => ['Menunggu pembayaran', 'Menunggu konfirmasi'].includes(order.status)).length}</b></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Dibatalkan</span><b>{busy ? '...' : stats?.cancelledCount ?? 0}</b></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Total transaksi</span><b>{busy ? '...' : stats?.totalOrders ?? 0}</b></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Nilai aktif</span><b>{busy ? '...' : formatIDR(stats?.estimatedValue ?? 0)}</b></div>
          </div>
        </div>
      </section>

      <section className="admin-queue card mt-7 p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <b>Queue operasi</b>
            <p className="mt-1 text-xs text-slate-500">Urutan berdasarkan order paling lama menunggu.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari nomor/order/pelanggan" className="field min-w-[220px]" />
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="field min-w-[180px]">
              <option value="all">Semua status</option>
              {statuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} className="field" />
            <input type="date" value={toDate} onChange={event => setToDate(event.target.value)} className="field" />
            <button onClick={applyFilters} className="btn btn-outline">Filter</button>
            <a href={exportUrl} className="btn btn-outline inline-flex items-center gap-2"><Download size={16} /> Ekspor CSV</a>
          </div>
        </div>

        <div className="admin-work-tabs mb-4 flex flex-wrap gap-2">
          {(['urgent','review','production','completed','all'] as WorkView[]).map(view => (
            <button key={view} aria-pressed={workView === view} onClick={() => { setWorkView(view); setSelectedOrderId(null); }} className={`rounded-full px-3 py-1.5 text-sm font-bold ${workView === view ? 'bg-[#12345b] text-white' : 'bg-slate-100 text-slate-600'}`}>
              {view === 'urgent' ? <>Urgent 24+ jam <span className="ml-1 rounded bg-white/15 px-1.5 py-0.5 text-xs">{urgentCount}</span></> : view === 'review' ? 'Perlu ditangani' : view === 'production' ? 'Dalam proses' : view === 'completed' ? 'Selesai' : 'Semua'}
            </button>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-3">Nomor</th>
                  <th>Prioritas / umur</th>
                  <th>Pelanggan</th>
                  <th>Status</th>
                  <th>Nilai</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map(order => {
                  const priority = getOrderAge(order.created_at);
                  return (
                    <tr key={order.id} className={`border-t ${selectedOrder?.id === order.id ? 'bg-amber-50' : ''}`}>
                      <td className="py-3 font-bold"><button onClick={() => setSelectedOrderId(order.id)} className="text-left text-[#12345b] underline">{order.order_number}</button></td>
                      <td><span className={`rounded px-2 py-1 text-[11px] font-bold ${priority.priorityClass}`}>{priority.priorityLabel}</span><p className="mt-1 text-xs text-slate-500">{priority.ageLabel}</p></td>
                      <td><b>{order.customer_name}</b><p className="text-xs text-slate-500">{order.email}</p></td>
                      <td><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusTone(order.status)}`}>{order.status}</span></td>
                      <td>{formatIDR(order.total_estimate || 0)}</td>
                      <td>
                        <select aria-label={`Ubah status ${order.order_number}`} aria-busy={statusSavingId === order.id} disabled={statusSavingId === order.id} className={`field min-w-[180px] font-semibold ${getStatusTone(order.status)} disabled:opacity-70`} value={order.status} onChange={event => void updateStatus(order.id, event.target.value)}>
                          {statuses.map(status => <option key={status}>{status}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {!busy && visibleOrders.length === 0 && !error && (
                  <tr><td className="py-6 text-slate-500" colSpan={6}>Tidak ada pesanan sesuai filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <aside aria-busy={detailBusy} className="admin-order-detail rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-black text-[#12345b]">Detail order</h3>
            {detailBusy && <p role="status" className="mt-2 text-xs text-slate-500">Memuat item dan file desain...</p>}
            {selectedOrder ? (
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Nomor order</p>
                  <p className="font-bold text-[#12345b]">{selectedOrder.order_number}</p>
                  <p className="mt-1 text-xs text-slate-500">Masuk {new Date(selectedOrder.created_at).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pelanggan</p>
                  <p className="font-bold">{selectedOrder.customer_name}</p>
                  <p className="text-slate-600">{selectedOrder.email}</p>
                  <p className="text-slate-600">{selectedOrder.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Alamat pengiriman</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{selectedOrder.address}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p><span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getStatusTone(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                </div>
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div>
                    <label htmlFor="shipping-courier" className="text-xs font-bold text-slate-600">Kurir / metode pengiriman</label>
                    <input id="shipping-courier" value={shippingCourierDraft} onChange={event => setShippingCourierDraft(event.target.value)} maxLength={80} className="field mt-1 w-full" placeholder="Contoh: JNE, J&T, ambil di toko" />
                  </div>
                  <div>
                    <label htmlFor="tracking-number" className="text-xs font-bold text-slate-600">Nomor resi</label>
                    <input id="tracking-number" value={trackingNumberDraft} onChange={event => setTrackingNumberDraft(event.target.value)} maxLength={120} className="field mt-1 w-full" placeholder="Masukkan nomor resi" />
                  </div>
                  <div>
                    <label htmlFor="shipped-at" className="text-xs font-bold text-slate-600">Tanggal dikirim</label>
                    <input id="shipped-at" type="datetime-local" value={shippedAtDraft} onChange={event => setShippedAtDraft(event.target.value)} className="field mt-1 w-full" />
                  </div>
                  <p className="text-[11px] leading-5 text-slate-500">Informasi ini akan terlihat pelanggan di halaman tracking.</p>
                  <button type="button" onClick={() => void saveShippingDetails()} disabled={savingShipping || (shippingCourierDraft === (selectedOrder.shipping_courier ?? '') && trackingNumberDraft === (selectedOrder.tracking_number ?? '') && shippedAtDraft === toLocalDateTime(selectedOrder.shipped_at))} className="btn btn-outline w-full disabled:opacity-50">{savingShipping ? 'Menyimpan...' : 'Simpan pengiriman'}</button>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Subtotal estimasi</p>
                  <p className="font-bold">{formatIDR(selectedOrder.total_estimate || 0)}</p>
                </div>
                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <label htmlFor="invoice-final-total" className="text-xs font-bold text-slate-600">Harga final invoice (Rp)</label>
                  <input id="invoice-final-total" type="number" min="1" step="1" required value={finalTotalDraft} onChange={event => setFinalTotalDraft(event.target.value)} className="field w-full" disabled={selectedOrder.invoice_status === 'sent'} placeholder="Masukkan total final" />
                  {selectedOrder.invoice_sent_at ? (
                    <p className="text-xs font-semibold text-emerald-700">Invoice terkirim ke email pelanggan pada {new Date(selectedOrder.invoice_sent_at).toLocaleString('id-ID')}.</p>
                  ) : (
                    <>
                      <p className="text-[11px] leading-5 text-slate-500">Mengirim invoice akan mengubah status order menjadi menunggu pembayaran.</p>
                      <button type="button" onClick={() => void sendInvoice()} disabled={sendingInvoice || selectedOrder.invoice_status === 'sending'} className="btn inline-flex w-full items-center justify-center gap-2 disabled:opacity-50">
                        <Mail size={16} />{sendingInvoice ? 'Mengirim invoice...' : 'Konfirmasi harga & kirim invoice'}
                      </button>
                    </>
                  )}
                  {selectedOrder.invoice_status === 'failed' && <p className="text-xs text-amber-700">Pengiriman sebelumnya gagal. Periksa email pengirim dan coba lagi.</p>}
                </div>
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500">Produk</p>
                    <ul className="mt-2 space-y-2">
                      {selectedOrder.order_items.map(item => (
                        <li key={item.id} className="rounded bg-white p-2">
                          <div className="flex justify-between gap-3"><b>{item.product_name}</b><span>{item.quantity}x</span></div>
                          <p className="text-xs text-slate-500">{item.specification}</p>
                          {item.design_url && <a href={item.design_url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-xs font-semibold text-blue-700 underline">Buka link desain pelanggan</a>}
                          <p className="text-xs text-slate-500">{item.note || 'Tanpa catatan khusus'}</p>
                          <div className="mt-2 flex justify-between gap-3 border-t border-slate-100 pt-2 text-xs"><span>{formatIDR(item.unit_price_estimate)} / unit</span><b>{formatIDR(item.unit_price_estimate * item.quantity)}</b></div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedOrder.designs && selectedOrder.designs.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500">File desain</p>
                    <div className="mt-2 space-y-2">
                      {selectedOrder.designs.map(design => (
                        <div key={design.id} className="flex items-center gap-2 rounded border border-slate-200 bg-white p-2">
                          <button type="button" onClick={() => setPreview(design)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Preview ${design.fileName}`}>
                            {design.contentType.startsWith('image/') && design.previewUrl
                              ? <img src={design.previewUrl} alt={`Preview ${design.fileName}`} className="h-12 w-14 shrink-0 rounded border border-slate-200 object-cover" />
                              : <span className="flex h-12 w-14 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-black uppercase text-slate-500">{design.contentType === 'application/pdf' ? 'PDF' : 'File'}</span>}
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-bold text-[#12345b]">{design.fileName}</span>
                              <span className="mt-1 block text-[11px] text-slate-500">{(design.fileSize / 1024 / 1024).toFixed(2)} MB · {design.reviewStatus}</span>
                            </span>
                          </button>
                          <button type="button" onClick={() => setPreview(design)} aria-label={`Lihat ${design.fileName}`} title="Lihat desain" className="rounded p-2 text-slate-600 hover:bg-slate-100 hover:text-[#12345b]">
                            <Eye size={16} />
                          </button>
                          {design.downloadUrl && (
                            <a href={design.downloadUrl} aria-label={`Download ${design.fileName}`} title="Download desain" className="rounded p-2 text-slate-600 hover:bg-slate-100 hover:text-[#12345b]">
                              <Download size={16} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!detailBusy && (!selectedOrder.designs || selectedOrder.designs.length === 0) && (
                  <p className="text-xs text-slate-500">Belum ada file desain terlampir.</p>
                )}
                {selectedOrder.notes && (
                  <div>
                    <p className="text-xs text-slate-500">Catatan pelanggan</p>
                    <p className="mt-1 text-slate-700">{selectedOrder.notes}</p>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-4">
                  <label htmlFor="admin-order-notes" className="text-xs font-bold text-slate-600">Catatan internal admin</label>
                  <textarea id="admin-order-notes" value={adminNotesDraft} onChange={event => setAdminNotesDraft(event.target.value)} maxLength={5000} rows={4} className="field mt-2 w-full resize-y" placeholder="Catatan produksi, tindak lanjut, atau informasi internal..." />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">Tidak terlihat oleh pelanggan</span>
                    <button type="button" onClick={() => void saveAdminNotes()} disabled={savingNotes || adminNotesDraft === (selectedOrder.admin_notes ?? '')} className="btn btn-outline disabled:opacity-50">{savingNotes ? 'Menyimpan...' : 'Simpan catatan'}</button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Pilih pesanan untuk melihat detail.</p>
            )}
          </aside>
        </div>
      </section>
      </>}
        </section>
      </div>
      {preview && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-3 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="design-preview-title"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setPreview(null);
          }}
        >
          <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 md:px-5">
              <div className="min-w-0">
                <h2 id="design-preview-title" className="truncate text-sm font-bold text-[#12345b]">{preview.fileName}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{(preview.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {preview.downloadUrl && (
                  <a href={preview.downloadUrl} className="btn btn-outline inline-flex items-center gap-2">
                    <Download size={16} /> Download
                  </a>
                )}
                <button type="button" onClick={() => setPreview(null)} aria-label="Tutup preview" className="rounded p-2 text-slate-600 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-3 md:p-5">
              {preview.previewUrl && preview.contentType === 'application/pdf'
                ? <iframe src={preview.previewUrl} title={`Preview ${preview.fileName}`} className="h-[78vh] w-full border-0 bg-white" />
                : preview.previewUrl && preview.contentType.startsWith('image/')
                  ? <img src={preview.previewUrl} alt={`Preview ${preview.fileName}`} className="mx-auto max-h-[78vh] max-w-full object-contain" />
                  : <p className="py-16 text-center text-sm text-slate-600">Preview tidak tersedia. Unduh file untuk membukanya.</p>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}