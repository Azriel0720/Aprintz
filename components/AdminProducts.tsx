'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { formatIDR } from '@/lib/products';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type Category = { id: string; name: string; slug: string };
type ProductImage = { id: string; image_url: string; alt_text: string; display_order: number };
type Product = {
  id: string;
  name: string;
  slug: string;
  category?: string;
  category_id: string | null;
  description: string | null;
  specifications: string;
  important_note: string;
  base_price: number;
  unit: string;
  stock_quantity: number;
  is_active: boolean;
  show_on_home: boolean;
  is_best_seller: boolean;
  images: ProductImage[];
};
type Draft = {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  specifications: string;
  importantNote: string;
  basePrice: string;
  unit: string;
  stockQuantity: string;
  isActive: boolean;
  showOnHome: boolean;
  isBestSeller: boolean;
};

const emptyDraft: Draft = {
  name: '',
  slug: '',
  categoryId: '',
  description: '',
  specifications: '',
  importantNote: '',
  basePrice: '0',
  unit: 'pcs',
  stockQuantity: '0',
  isActive: true,
  showOnHome: false,
  isBestSeller: false,
};

async function readApiResponse(response: Response, fallbackMessage: string) {
  const text = await response.text();
  if (!text) {
    throw new Error(`${fallbackMessage} (server mengembalikan respons kosong, HTTP ${response.status}).`);
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`${fallbackMessage} (respons server bukan JSON, HTTP ${response.status}).`);
  }
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/products');
      const data = await readApiResponse(response, 'Produk gagal dimuat.') as { products: Product[]; categories: Category[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Produk gagal dimuat.');
      setProducts(data.products);
      setCategories(data.categories);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Produk gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    if (!imageFiles.length) {
      setImagePreviews([]);
      return;
    }
    const previews = imageFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => previews.forEach(URL.revokeObjectURL);
  }, [imageFiles]);

  useEffect(() => {
    if (formOpen) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [formOpen, editingId]);

  function startCreate() {
    setEditingId(null);
    setDraft({ ...emptyDraft, categoryId: categories[0]?.id ?? '' });
    setImageFiles([]);
    setFormOpen(true);
    setError('');
    setNotice('');
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    const categoryId = product.category_id ?? categories.find(category =>
      category.name.trim().toLocaleLowerCase('id-ID') === product.category?.trim().toLocaleLowerCase('id-ID')
      || category.slug === product.category?.trim().toLocaleLowerCase('id-ID').replace(/\s+/g, '-'),
    )?.id ?? '';
    setDraft({
      name: product.name,
      slug: product.slug,
      categoryId,
      description: product.description ?? '',
      specifications: product.specifications ?? '',
      importantNote: product.important_note ?? '',
      basePrice: String(product.base_price),
      unit: product.unit,
      stockQuantity: String(product.stock_quantity ?? 0),
      isActive: product.is_active,
      showOnHome: product.show_on_home,
      isBestSeller: product.is_best_seller,
    });
    setImageFiles([]);
    setFormOpen(true);
    setError('');
    setNotice('');
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setError('');
    if (!files.length) {
      setImageFiles([]);
      return;
    }
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setError('Foto harus berformat JPG, PNG, atau WebP.');
      event.target.value = '';
      setImageFiles([]);
      return;
    }
    if (files.some(file => file.size > 50 * 1024 * 1024)) {
      setError('Ukuran foto maksimal 50 MB.');
      event.target.value = '';
      setImageFiles([]);
      return;
    }
    const savedImageCount = editingId ? products.find(product => product.id === editingId)?.images.length ?? 0 : 0;
    if (savedImageCount + files.length > 20) {
      setError('Maksimal 20 foto untuk setiap produk.');
      event.target.value = '';
      setImageFiles([]);
      return;
    }
    setImageFiles(files);
  }

  async function removeImage(productId: string, imageId: string) {
    if (!window.confirm('Hapus foto produk ini?')) return;
    try {
      const response = await fetch(`/api/admin/products/${productId}/image`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });
      const data = await readApiResponse(response, 'Foto gagal dihapus.') as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Foto gagal dihapus.');
      setNotice('Foto produk dihapus.');
      await loadProducts();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Foto gagal dihapus.');
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    const existingProduct = editingId ? products.find(product => product.id === editingId) : undefined;
    setSaving(true);
    const payload = {
      ...draft,
      slug: draft.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      basePrice: Number(draft.basePrice),
      stockQuantity: Number(draft.stockQuantity),
    };
    const deferActivation = !editingId && !existingProduct?.images.length && !imageFiles.length && draft.isActive;
    let migrationWarning = '';

    try {
      const response = await fetch(editingId ? `/api/admin/products/${editingId}` : '/api/admin/products', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, isActive: deferActivation ? false : draft.isActive }),
      });
      const data = await readApiResponse(response, 'Produk gagal disimpan.') as { error?: string; warning?: string; product: Product };
      if (!response.ok) throw new Error(data.error || 'Produk gagal disimpan.');
      migrationWarning = data.warning ?? '';

      const productId = editingId ?? data.product.id;
      setEditingId(productId);

      for (const [index, imageFile] of imageFiles.entries()) {
        setNotice(`Menyiapkan upload foto ${index + 1} dari ${imageFiles.length}...`);
        const uploadUrlResponse = await fetch(`/api/admin/products/${productId}/image/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: imageFile.type }),
        });
        const uploadUrlData = await readApiResponse(uploadUrlResponse, 'Server gagal menyiapkan upload foto.') as { error?: string; path: string; token: string };
        if (!uploadUrlResponse.ok) throw new Error(uploadUrlData.error || 'Server gagal menyiapkan upload foto.');

        const { error: storageError } = await createBrowserSupabase()
          .storage
          .from('product-images')
          .uploadToSignedUrl(uploadUrlData.path, uploadUrlData.token, imageFile, {
            contentType: imageFile.type,
            cacheControl: '3600',
          });
        if (storageError) throw new Error(`Foto "${imageFile.name}" gagal diunggah: ${storageError.message}`);

        const imageResponse = await fetch(`/api/admin/products/${productId}/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: uploadUrlData.path, contentType: imageFile.type, fileName: imageFile.name }),
        });
        const imageData = await readApiResponse(imageResponse, `Foto "${imageFile.name}" gagal disimpan ke katalog.`) as { error?: string };
        if (!imageResponse.ok) throw new Error(imageData.error || `Foto "${imageFile.name}" gagal disimpan ke katalog.`);
        setImageFiles(current => current.filter(file => file !== imageFile));
      }

      if (deferActivation) {
        const activation = await fetch(`/api/admin/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const activationData = await readApiResponse(activation, 'Produk gagal diaktifkan.') as { error?: string; warning?: string };
        if (!activation.ok) throw new Error(activationData.error || 'Foto tersimpan, produk belum berhasil diaktifkan.');
        migrationWarning = activationData.warning ?? migrationWarning;
      }

      setNotice(migrationWarning || (editingId ? 'Perubahan produk tersimpan.' : 'Produk dan foto berhasil ditambahkan.'));
      setDraft(emptyDraft);
      setEditingId(null);
      setImageFiles([]);
      setFormOpen(false);
      await loadProducts();
    } catch (saveError) {
      const message = saveError instanceof TypeError
        ? 'Koneksi terputus saat mengunggah foto. Periksa internet lalu coba lagi; foto yang sudah berhasil diunggah tetap tersimpan.'
        : saveError instanceof Error ? saveError.message : 'Produk gagal disimpan.';
      await loadProducts();
      setError(message);
    } finally {
      setSaving(false);
    }

  }

  const filteredProducts = products.filter(product => {
    const query = searchTerm.trim().toLocaleLowerCase('id-ID');
    if (!query) return true;
    const category = categories.find(item => item.id === product.category_id)?.name ?? '';
    return `${product.name} ${product.slug} ${category}`.toLocaleLowerCase('id-ID').includes(query);
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#12345b]">Produk & stok</h2>
          <p className="mt-1 text-sm text-slate-500">Kelola katalog, spesifikasi, catatan, harga, stok, foto, dan status publikasi. Foto bisa ditambahkan nanti.</p>
        </div>
        <button onClick={startCreate} disabled={!categories.length} className="btn disabled:opacity-50">Tambah produk</button>
      </div>

      {!categories.length && !loading && (
        <p role="status" className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          Kategori belum tersedia. Jalankan migration katalog Supabase sebelum menambah produk.
        </p>
      )}
      {error && <p role="alert" className="bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="bg-green-50 p-4 text-sm text-green-700">{notice}</p>}

      {formOpen && (
        <form ref={formRef} onSubmit={saveProduct} className="scroll-mt-6 border-y border-slate-200 py-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-bold text-[#12345b]">{editingId ? 'Edit produk' : 'Tambah produk'}</h3>
            <button type="button" onClick={() => setFormOpen(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Batal</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold">Nama produk
              <input required minLength={2} maxLength={120} className="field mt-2 font-normal" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
            </label>
            <label className="text-sm font-semibold">Slug URL
              <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="field mt-2 font-normal" placeholder="contoh: stiker-vinyl" value={draft.slug} onChange={event => setDraft({ ...draft, slug: event.target.value.toLowerCase().replace(/\s+/g, '-') })} />
            </label>
            <label className="text-sm font-semibold">Kategori
              <select required className="field mt-2 font-normal" value={draft.categoryId} onChange={event => setDraft({ ...draft, categoryId: event.target.value })}>
                <option value="">Pilih kategori</option>
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Harga dasar (IDR)
              <input required type="number" min="0" step="1" className="field mt-2 font-normal" value={draft.basePrice} onChange={event => setDraft({ ...draft, basePrice: event.target.value })} />
            </label>
            <label className="text-sm font-semibold">Satuan
              <input required maxLength={32} className="field mt-2 font-normal" placeholder="pcs, lembar, m2" value={draft.unit} onChange={event => setDraft({ ...draft, unit: event.target.value })} />
            </label>
            <label className="text-sm font-semibold">Stok
              <input required type="number" min="0" step="1" className="field mt-2 font-normal" value={draft.stockQuantity} onChange={event => setDraft({ ...draft, stockQuantity: event.target.value })} />
            </label>
            <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">Deskripsi
              <textarea maxLength={2000} className="field mt-2 min-h-24 font-normal" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
            </label>
            <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">Spesifikasi produk · satu poin per baris
              <textarea maxLength={5000} className="field mt-2 min-h-28 font-normal" placeholder={'Tersedia beberapa ukuran\nHasil cetak full color\nEstimasi pengerjaan 1 hari'} value={draft.specifications} onChange={event => setDraft({ ...draft, specifications: event.target.value })} />
            </label>
            <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">Catatan penting
              <textarea maxLength={3000} className="field mt-2 min-h-24 font-normal" placeholder="Informasi warna, file cetak, bahan, atau hal khusus lainnya" value={draft.importantNote} onChange={event => setDraft({ ...draft, importantNote: event.target.value })} />
            </label>
            <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">Foto produk (opsional) · pilih beberapa foto (maks 20 total, JPG/PNG/WebP, 50 MB per foto)
              <input
                multiple
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="field mt-2 font-normal"
                onChange={chooseImage}
              />
            </label>
            <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
              {(products.find(product => product.id === editingId)?.images ?? []).map(image => (
                <div key={image.id} className="relative">
                  <img src={image.image_url} alt={image.alt_text || 'Foto produk'} className="h-28 w-32 rounded-lg border border-slate-200 object-cover" />
                  <button type="button" onClick={() => void removeImage(editingId!, image.id)} className="absolute right-1 top-1 rounded bg-white/95 px-2 py-1 text-xs font-bold text-red-700 shadow">Hapus</button>
                </div>
              ))}
              {imagePreviews.map((preview, index) => <img key={preview} src={preview} alt={`Preview foto baru ${index + 1}`} className="h-28 w-32 rounded-lg border border-slate-200 object-cover" />)}
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={draft.isActive} onChange={event => setDraft({ ...draft, isActive: event.target.checked })} /> Tampilkan di katalog
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={draft.showOnHome} onChange={event => setDraft({ ...draft, showOnHome: event.target.checked })} /> Produk umum di beranda
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={draft.isBestSeller} onChange={event => setDraft({ ...draft, isBestSeller: event.target.checked })} /> Best seller
            </label>
          </div>
          <button disabled={saving || !categories.length} className="btn mt-5 disabled:opacity-50">
            {saving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Buat produk'}
          </button>
        </form>
      )}

      <label className="relative block max-w-xl">
        <span className="sr-only">Cari produk admin</span>
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          className="field pl-10"
          placeholder="Cari nama, slug, atau kategori produk..."
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
        />
      </label>

      <div className="overflow-x-auto border-y border-slate-200">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="py-3 pr-4">Produk</th>
              <th className="pr-4">Kategori</th>
              <th className="pr-4">Harga</th>
              <th className="pr-4">Stok</th>
              <th className="pr-4">Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id} className="border-t border-slate-100">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {product.images[0]?.image_url
                      ? <img src={product.images[0].image_url} alt={product.images[0].alt_text || product.name} className="h-12 w-14 rounded border border-slate-200 object-cover" />
                      : <div className="flex h-12 w-14 items-center justify-center rounded border border-dashed border-slate-300 text-[10px] text-slate-400">No foto</div>}
                    <div><b>{product.name}</b><p className="text-xs text-slate-500">/{product.slug}</p></div>
                  </div>
                </td>
                <td className="pr-4">{categories.find(category => category.id === product.category_id)?.name ?? product.category ?? 'Belum dikategorikan'}</td>
                <td className="pr-4">{formatIDR(Number(product.base_price))} / {product.unit}</td>
                <td className="pr-4">{product.stock_quantity}</td>
                <td className="pr-4">{product.is_active ? 'Aktif' : 'Disembunyikan'}{product.show_on_home ? ' · Beranda' : ''}{product.is_best_seller ? ' · Best seller' : ''}</td>
                <td><button type="button" onClick={() => startEdit(product)} className="font-bold text-blue-700 underline">Edit</button></td>
              </tr>
            ))}
            {!loading && products.length === 0 && !error && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">Belum ada produk di database.</td></tr>
            )}
            {!loading && products.length > 0 && filteredProducts.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">Tidak ada produk yang cocok dengan “{searchTerm}”.</td></tr>
            )}
            {loading && <tr><td colSpan={6} className="py-8 text-center text-slate-500">Memuat produk...</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}