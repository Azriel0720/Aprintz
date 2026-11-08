'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Copy } from 'lucide-react';

export default function TrackingClient() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get('code') || '');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);

  async function copyTrackingNumber() {
    if (!result?.tracking_number) return;
    try {
      await navigator.clipboard.writeText(result.tracking_number);
      setCopiedTracking(true);
      window.setTimeout(() => setCopiedTracking(false), 1800);
    } catch {
      setError('Nomor resi gagal disalin. Silakan salin secara manual.');
    }
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);

    const r = await fetch(`/api/orders?code=${encodeURIComponent(code)}`);
    const d = await r.json();

    if (!r.ok) setError(d.error || 'Pesanan tidak ditemukan');
    else setResult(d.order);
  }

  return (
    <main className="container min-h-[65vh] py-16">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow">ORDER STATUS</p>
        <h1 className="mt-3 text-3xl font-black text-[#12345b]">Lacak Pesanan</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Masukkan nomor pesanan untuk melihat perkembangan proses pesananmu.
        </p>

        <form onSubmit={search} className="card mt-8 flex gap-2 p-3">
          <input
            required
            className="field border-0"
            placeholder="Contoh: APR-2026-00001"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button className="btn">Lacak</button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="card mt-6 p-6">
            <div className="flex justify-between">
              <b>{result.order_number}</b>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-700">
                {result.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">Pelanggan: {result.customer_name}</p>
            <p className="mt-1 text-sm text-slate-500">
              Dibuat: {new Date(result.created_at).toLocaleString('id-ID')}
            </p>
            {(result.shipping_courier || result.tracking_number || result.shipped_at || result.status === 'Dalam pengiriman') && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <h2 className="text-sm font-bold text-[#12345b]">Informasi pengiriman</h2>
                {result.shipping_courier && <p className="mt-2 text-sm text-slate-600">Kurir / metode: <b className="text-slate-800">{result.shipping_courier}</b></p>}
                {result.shipped_at && <p className="mt-1 text-sm text-slate-600">Dikirim: {new Date(result.shipped_at).toLocaleString('id-ID')}</p>}
                {result.tracking_number ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-slate-200 p-3">
                    <div>
                      <p className="text-xs text-slate-500">Nomor resi</p>
                      <p className="mt-1 break-all font-mono text-sm font-bold text-[#12345b]">{result.tracking_number}</p>
                    </div>
                    <button type="button" onClick={() => void copyTrackingNumber()} className="btn btn-outline inline-flex items-center gap-2">
                      {copiedTracking ? <Check size={16} /> : <Copy size={16} />}
                      {copiedTracking ? 'Tersalin' : 'Salin resi'}
                    </button>
                  </div>
                ) : result.status === 'Dalam pengiriman' ? (
                  <p className="mt-2 text-sm text-slate-500">Nomor resi belum dicatat. Silakan hubungi CS jika perlu bantuan.</p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
