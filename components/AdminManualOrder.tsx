'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { formatIDR } from '@/lib/products';

type Variant = { id: string; name: string; unit_price: number; min_quantity: number };
type Product = { id: string; slug: string; name: string; base_price: number; unit: string; is_active: boolean; variants: Variant[] };

type AdminManualOrderProps = {
  onCreated: () => void;
};

export default function AdminManualOrder({ onCreated }: AdminManualOrderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', slug: '', variantId: '', qty: '1', note: '' });

  useEffect(() => {
    void fetch('/api/admin/products')
      .then(async response => {
        const data = await response.json();
        if (response.ok) setProducts(data.products.filter((product: Product) => product.is_active));
      })
      .catch(() => setError('Produk tidak dapat dimuat.'));
  }, []);

  const selectedProduct = products.find(product => product.slug === form.slug);
  const selectedVariant = selectedProduct?.variants.find(variant => variant.id === form.variantId);
  const minQuantity = selectedVariant?.min_quantity ?? 1;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          notes: 'Dibuat oleh admin. ' + form.note,
          items: [{
            slug: selectedProduct.slug,
            variantId: selectedVariant?.id,
            option: selectedVariant?.name ?? 'Spesifikasi dikonfirmasi oleh admin',
            qty: Number(form.qty),
          }],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pesanan gagal dibuat.');
      setSuccess(`Pesanan ${data.order.order_number} berhasil dibuat sebagai permintaan, belum dibayar.`);
      setForm({ name: '', email: '', phone: '', address: '', slug: '', variantId: '', qty: '1', note: '' });
      onCreated();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Pesanan gagal dibuat.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-y border-slate-200 py-5">
      <button onClick={() => setOpen(value => !value)} aria-expanded={open} className="text-sm font-bold text-blue-700 underline">
        {open ? 'Tutup form pesanan manual' : 'Buat pesanan manual'}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-semibold">Nama pelanggan
            <input required className="field mt-2 font-normal" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="text-sm font-semibold">Email pelanggan
            <input required type="email" className="field mt-2 font-normal" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="text-sm font-semibold">Nomor telepon
            <input required type="tel" className="field mt-2 font-normal" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">Alamat
            <input required className="field mt-2 font-normal" value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} />
          </label>
          <label className="text-sm font-semibold">Produk
            <select required className="field mt-2 font-normal" value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value, variantId: '' })}>
              <option value="">Pilih produk</option>
              {products.map(product => <option key={product.id} value={product.slug}>{product.name}</option>)}
            </select>
          </label>
          {selectedProduct?.variants.length ? (
            <label className="text-sm font-semibold">Variasi
              <select required className="field mt-2 font-normal" value={form.variantId} onChange={event => setForm({ ...form, variantId: event.target.value })}>
                <option value="">Pilih variasi</option>
                {selectedProduct.variants.map(variant => <option key={variant.id} value={variant.id}>{variant.name} · {formatIDR(Number(variant.unit_price))}</option>)}
              </select>
            </label>
          ) : selectedProduct && (
            <p className="self-end pb-3 text-sm text-slate-500">Harga dasar: {formatIDR(Number(selectedProduct.base_price))} / {selectedProduct.unit}</p>
          )}
          <label className="text-sm font-semibold">Jumlah
            <input required type="number" min={minQuantity} step="1" className="field mt-2 font-normal" value={form.qty} onChange={event => setForm({ ...form, qty: event.target.value })} />
          </label>
          <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">Catatan
            <textarea className="field mt-2 min-h-20 font-normal" value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} />
          </label>
          {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{error}</p>}
          {success && <p role="status" className="text-sm text-green-700 sm:col-span-2 lg:col-span-3">{success}</p>}
          <button disabled={busy || !products.length} className="btn w-fit disabled:opacity-50">{busy ? 'Menyimpan...' : 'Buat permintaan pesanan'}</button>
          <p className="self-center text-xs text-slate-500 sm:col-span-2">Total dihitung server dari harga produk; membuat order tidak menandai pembayaran lunas.</p>
        </form>
      )}
    </section>
  );
}