'use client';

import { useState } from 'react';
import { Download, Eye, FileImage, FileText } from 'lucide-react';
import { formatIDR } from '@/lib/products';
import AdminManualOrder from '@/components/AdminManualOrder';

type WorkView = 'review' | 'production' | 'completed' | 'all';

type DesignPreview = {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  reviewStatus: string;
  createdAt: string;
  previewUrl: string | null;
};

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  status: string;
  total_estimate: number;
  created_at: string;
  designs: DesignPreview[];
};

type Stats = {
  totalOrders: number;
  reviewCount: number;
  activeCount: number;
  completedCount: number;
  estimatedValue: number;
  weekly: { label: string; value: number }[];
};

type AdminOrderQueueProps = {
  orders: Order[];
  stats: Stats | null;
  loading: boolean;
  error: string;
  designsReady: boolean;
  onRefresh: () => void;
  onStatusChange: (orderId: string, status: string) => void;
};

const reviewStatuses = new Set([
  'Menunggu konfirmasi',
  'Menunggu pembayaran',
  'Pembayaran berhasil',
  'Proses desain',
  'Menunggu persetujuan desain',
]);
const productionStatuses = new Set(['Dalam produksi', 'Quality control', 'Siap dikirim/diambil', 'Dalam pengiriman']);
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

function ageLabel(createdAt: string) {
  const hours = Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 3_600_000));
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function DesignPreviewDialog({ design, onClose }: { design: DesignPreview; onClose: () => void }) {
  return (
    <div role="presentation" className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Preview desain ${design.fileName}`}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col bg-white shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-bold text-[#12345b]">{design.fileName}</h2>
            <p className="mt-1 text-xs text-slate-500">Review: {design.reviewStatus} · {(design.fileSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {design.previewUrl && <a href={design.previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700"><Download size={16} /> Buka file</a>}
            <button onClick={onClose} className="px-2 py-1 text-sm font-bold text-slate-500 hover:text-slate-900">Tutup</button>
          </div>
        </header>
        <div className="flex min-h-[50vh] flex-1 items-center justify-center overflow-auto bg-slate-100 p-3">
          {!design.previewUrl ? (
            <p className="text-sm text-slate-600">Preview tidak tersedia. Coba muat ulang antrean admin.</p>
          ) : design.contentType === 'application/pdf' ? (
            <iframe title={`Preview ${design.fileName}`} src={design.previewUrl} className="h-[72vh] w-full bg-white" />
          ) : design.contentType.startsWith('image/') ? (
            <img src={design.previewUrl} alt={`Desain pelanggan ${design.fileName}`} className="max-h-[76vh] max-w-full object-contain" />
          ) : (
            <div className="text-center">
              <FileText size={42} className="mx-auto text-slate-500" />
              <p className="mt-3 text-sm text-slate-600">Format ini tidak dapat ditampilkan langsung.</p>
              <a href={design.previewUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex font-bold text-blue-700 underline">Unduh file desain</a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AdminOrderQueue({ orders, stats, loading, error, designsReady, onRefresh, onStatusChange }: AdminOrderQueueProps) {
  const [workView, setWorkView] = useState<WorkView>('review');
  const [preview, setPreview] = useState<DesignPreview | null>(null);

  const visibleOrders = orders
    .filter(order => {
      if (workView === 'review') return reviewStatuses.has(order.status);
      if (workView === 'production') return productionStatuses.has(order.status);
      if (workView === 'completed') return ['Selesai', 'Dibatalkan'].includes(order.status);
      return true;
    })
    .sort((left, right) => workView === 'completed'
      ? Date.parse(right.created_at) - Date.parse(left.created_at)
      : Date.parse(left.created_at) - Date.parse(right.created_at));

  const productionCount = orders.filter(order => productionStatuses.has(order.status)).length;
  const tabs: { id: WorkView; label: string; count: number }[] = [
    { id: 'review', label: 'Perlu ditangani', count: stats?.reviewCount ?? 0 },
    { id: 'production', label: 'Dalam proses', count: productionCount },
    { id: 'completed', label: 'Selesai', count: stats?.completedCount ?? 0 },
    { id: 'all', label: 'Semua order', count: stats?.totalOrders ?? orders.length },
  ];

  return (
    <section className="space-y-7">
      {error && <p role="alert" className="border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!designsReady && <p role="status" className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">Tabel file desain belum tersedia. Jalankan schema terbaru di Supabase SQL Editor.</p>}

      <div className="grid grid-cols-2 border-y border-slate-200 bg-white sm:grid-cols-4">
        <div className="border-b border-r border-slate-200 p-4 sm:border-b-0"><p className="text-xs font-semibold text-slate-500">Total order</p><p className="mt-1 text-2xl font-black text-[#12345b]">{loading ? '…' : stats?.totalOrders ?? 0}</p></div>
        <div className="border-b border-slate-200 p-4 sm:border-b-0 sm:border-r"><p className="text-xs font-semibold text-slate-500">Perlu ditangani</p><p className="mt-1 text-2xl font-black text-amber-700">{loading ? '…' : stats?.reviewCount ?? 0}</p></div>
        <div className="border-r border-slate-200 p-4"><p className="text-xs font-semibold text-slate-500">Dalam proses</p><p className="mt-1 text-2xl font-black text-[#12345b]">{loading ? '…' : productionCount}</p></div>
        <div className="p-4"><p className="text-xs font-semibold text-slate-500">Selesai</p><p className="mt-1 text-2xl font-black text-[#12345b]">{loading ? '…' : stats?.completedCount ?? 0}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(250px,.8fr)]">
        <section className="border-y border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="font-bold text-[#12345b]">Nilai estimasi order aktif</h2><p className="mt-1 text-xs text-slate-500">Per minggu · bukan pembayaran terverifikasi</p></div>
            <span className="text-xs font-semibold text-slate-400">{formatIDR(stats?.estimatedValue ?? 0)}</span>
          </div>
          <div className="mt-5 grid h-36 grid-cols-6 items-end gap-3" aria-label="Grafik nilai order mingguan">
            {(stats?.weekly ?? []).map(week => {
              const maxValue = Math.max(...(stats?.weekly.map(item => item.value) ?? [0]), 1);
              const height = Math.max(week.value > 0 ? 8 : 2, (week.value / maxValue) * 100);
              return <div key={week.label} className="flex h-full flex-col items-center justify-end gap-2"><div className="w-full rounded-t bg-brand-600" style={{ height: `${height}%` }} title={formatIDR(week.value)} /><span className="text-[10px] text-slate-500">{week.label}</span></div>;
            })}
          </div>
        </section>
        <section className="flex items-start gap-3 border-y border-amber-200 bg-amber-50 p-5">
          <FileImage size={20} className="mt-0.5 shrink-0 text-amber-700" />
          <div><h2 className="font-bold text-amber-900">Payout belum terhubung</h2><p className="mt-1 text-sm leading-6 text-amber-900/80">Nilai di atas estimasi order. Pembayaran dan penarikan saldo belum terintegrasi.</p></div>
        </section>
      </div>

      <AdminManualOrder onCreated={onRefresh} />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200">
          <nav aria-label="Filter antrean order" className="flex max-w-full gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setWorkView(tab.id)} aria-current={workView === tab.id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${workView === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                {tab.label}<span className="text-xs text-slate-400">{tab.count}</span>
              </button>
            ))}
          </nav>
          <span className="pb-3 text-xs text-slate-500">Order menunggu paling lama ditampilkan lebih dulu.</span>
        </div>

        <div className="overflow-x-auto border-b border-slate-200 bg-white">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr><th className="px-4 py-3">Order / usia</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Desain</th><th className="px-4 py-3">Estimasi</th><th className="px-4 py-3">Status / tindakan</th></tr>
            </thead>
            <tbody>
              {visibleOrders.map(order => (
                <tr key={order.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-4"><b className="text-[#12345b]">{order.order_number}</b><p className="mt-1 text-xs text-slate-500">{ageLabel(order.created_at)}</p></td>
                  <td className="px-4 py-4"><b>{order.customer_name}</b><a href={`mailto:${order.email}`} className="mt-1 block text-xs text-blue-700 underline">{order.email}</a><a href={`tel:${order.phone}`} className="mt-1 block text-xs text-slate-500">{order.phone}</a></td>
                  <td className="px-4 py-4">
                    {order.designs.length ? <div className="flex flex-col items-start gap-2">{order.designs.map(design => <button key={design.id} onClick={() => setPreview(design)} className="inline-flex items-center gap-2 font-semibold text-blue-700 underline"><Eye size={15} /> Preview ({design.fileName})</button>)}</div> : <span className="text-xs text-slate-400">Belum ada file</span>}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{formatIDR(order.total_estimate || 0)}</td>
                  <td className="px-4 py-4"><select aria-label={`Status ${order.order_number}`} className="field min-w-56" value={order.status} onChange={event => onStatusChange(order.id, event.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></td>
                </tr>
              ))}
              {!loading && visibleOrders.length === 0 && <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={5}>Tidak ada order dalam antrean ini.</td></tr>}
              {loading && <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={5}>Memuat antrean order…</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {preview && <DesignPreviewDialog design={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}