'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FileImage, FileText, X } from 'lucide-react';
import { formatIDR } from '@/lib/products';
import { getDesignFile, removeDesignFile } from '@/lib/design-files';

type CartItem = {
  key: string;
  name: string;
  slug: string;
  option: string;
  variantId?: string;
  qty: number;
  price: number;
  note?: string;
  designUrl?: string;
};

const allowedDesignExtensions = ['pdf', 'ai', 'cdr', 'psd', 'jpg', 'jpeg', 'png', 'webp', 'svg', 'zip', 'rar'];
const maxDesignSize = 50 * 1024 * 1024;

export default function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [productDesignFiles, setProductDesignFiles] = useState<{ key: string; name: string; file: File }[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('aprintz-cart') || '[]');
      const savedCart = Array.isArray(saved) ? saved as CartItem[] : [];
      setCart(savedCart);
      void Promise.all(savedCart.map(async item => {
        const file = await getDesignFile(item.key);
        return file ? { key: item.key, name: item.name, file } : null;
      })).then(files => setProductDesignFiles(files.filter((file): file is { key: string; name: string; file: File } => file !== null)))
        .catch(loadError => setMessage(loadError instanceof Error ? loadError.message : 'File desain gagal dimuat.'));
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    if (!designFile || !designFile.type.startsWith('image/') || designFile.type === 'image/svg+xml') {
      setDesignPreview(null);
      return;
    }
    const preview = URL.createObjectURL(designFile);
    setDesignPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [designFile]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function chooseDesign(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMessage('');
    if (!file) {
      setDesignFile(null);
      return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedDesignExtensions.includes(extension)) {
      setMessage('Format desain harus PDF, AI, CDR, PSD, JPG, PNG, WebP, SVG, ZIP, atau RAR.');
      event.target.value = '';
      setDesignFile(null);
      return;
    }
    if (file.size > maxDesignSize) {
      setMessage('Ukuran file desain maksimal 50 MB.');
      event.target.value = '';
      setDesignFile(null);
      return;
    }
    setDesignFile(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const body = new FormData();
      body.set('name', form.name);
      body.set('email', form.email);
      body.set('phone', form.phone);
      body.set('address', form.address);
      body.set('notes', form.notes);
      body.set('items', JSON.stringify(cart.map(({ slug, variantId, option, qty, note, designUrl }) => ({ slug, variantId, option, qty, note, designUrl }))));
      if (designFile) body.set('design', designFile);
      for (const item of productDesignFiles) {
        body.append('designFiles', new File([item.file], `${item.name} - ${item.file.name}`, { type: item.file.type }));
      }

      const response = await fetch('/api/orders', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pesanan gagal dikirim.');
      await Promise.all(cart.map(item => removeDesignFile(item.key)));
      localStorage.removeItem('aprintz-cart');
      router.push(`/tracking?code=${data.order.order_number}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container min-h-[70vh] py-10 md:py-12">
      <h1 className="text-3xl font-black text-[#12345b]">Checkout</h1>
      <p className="mt-2 text-sm text-slate-500">Lengkapi kontak agar tim APRINTZ dapat meninjau spesifikasi dan mengonfirmasi order.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={submit} className="space-y-6">
          <section className="border-y border-slate-200 py-5">
            <h2 className="mb-4 font-bold text-[#12345b]">Informasi pelanggan</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ['name', 'Nama lengkap', 'text'],
                ['email', 'Email', 'email'],
                ['phone', 'Nomor WhatsApp', 'tel'],
                ['address', 'Alamat pengiriman', 'text'],
              ] as const).map(([field, label, type]) => (
                <label key={field} className="block text-sm font-bold">
                  {label}
                  <input
                    required
                    className="field mt-2 font-normal"
                    type={type}
                    value={form[field]}
                    onChange={event => setForm({ ...form, [field]: event.target.value })}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="border-b border-slate-200 pb-5">
            <h2 className="font-bold text-[#12345b]">File desain tambahan</h2>
            <p className="mt-1 text-sm text-slate-500">File yang dipilih pada halaman produk akan ikut dikirim otomatis.</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Unggah PDF, AI, CDR, PSD, JPG, PNG, WebP, SVG, ZIP, atau RAR hingga 50 MB. File disimpan privat dan hanya dapat ditinjau admin.</p>
            <a href="/panduan-desain" className="mt-2 inline-flex text-sm font-semibold text-blue-700 underline">Panduan menyiapkan file desain</a>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center border border-dashed border-slate-300 bg-white px-5 py-7 text-center hover:border-blue-400">
              <FileImage size={24} className="text-blue-600" />
              <span className="mt-2 text-sm font-bold text-[#12345b]">Pilih file desain</span>
              <span className="mt-1 text-xs text-slate-500">PDF, AI, CDR, PSD, JPG, PNG, WebP, SVG, ZIP, RAR · maksimal 50 MB</span>
              <input type="file" className="sr-only" accept=".pdf,.ai,.cdr,.psd,.png,.jpg,.jpeg,.webp,.svg,.zip,.rar" onChange={chooseDesign} />
            </label>
            {designFile && (
              <div className="mt-4 flex items-center gap-4 border border-slate-200 p-3">
                {designPreview
                  ? <img src={designPreview} alt="Preview desain yang dipilih" className="h-20 w-24 rounded border border-slate-200 object-contain" />
                  : <div className="flex h-20 w-24 items-center justify-center rounded bg-slate-100"><FileText className="text-slate-500" /></div>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#12345b]">{designFile.name}</p>
                  <p className="text-xs text-slate-500">{(designFile.size / 1024 / 1024).toFixed(2)} MB · {designFile.type || 'File desain'}</p>
                </div>
                <button type="button" onClick={() => setDesignFile(null)} aria-label="Hapus file desain" className="rounded p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
              </div>
            )}
            <label className="mt-4 block text-sm font-bold">
              Catatan tambahan
              <textarea className="field mt-2 min-h-24 font-normal" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} />
            </label>
          </section>

          {message && <p role="alert" className="text-sm text-red-600">{message}</p>}
          <button disabled={busy || !cart.length} className="btn disabled:opacity-50">{busy ? 'Mengirim...' : 'Kirim permintaan pesanan'}</button>
          <p className="text-xs leading-5 text-slate-500">Order ini adalah permintaan, bukan pembayaran otomatis. Tim APRINTZ mengonfirmasi harga dan jadwal produksi.</p>
        </form>

        <aside className="h-fit border-y border-slate-200 py-5">
          <b className="text-[#12345b]">Ringkasan pesanan</b>
          {cart.map(item => (
            <div key={item.key} className="mt-4 flex justify-between gap-3 text-sm">
              <span>{item.name} × {item.qty}<span className="block text-xs text-slate-500">{item.option}</span>{productDesignFiles.find(file => file.key === item.key) && <span className="block text-xs text-emerald-700">File: {productDesignFiles.find(file => file.key === item.key)?.file.name}</span>}{item.designUrl && <a href={item.designUrl} target="_blank" rel="noreferrer" className="block break-all text-xs text-brand-700 underline">Link desain</a>}</span>
              <b className="whitespace-nowrap">{formatIDR(item.price * item.qty)}</b>
            </div>
          ))}
          <div className="mt-5 flex justify-between border-t border-slate-200 pt-4">
            <b>Subtotal indikatif</b><b className="text-brand-700">{formatIDR(total)}</b>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Harga akhir diperiksa tim setelah file dan spesifikasi ditinjau.</p>
        </aside>
      </div>
    </main>
  );
}