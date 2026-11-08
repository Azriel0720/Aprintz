'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';

type Banner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta_label: string;
  href: string;
  image_url: string;
  image_path: string;
  display_order: number;
  is_active: boolean;
};

type BannerDraft = Omit<Banner, 'id'>;

const emptyBanner: BannerDraft = {
  eyebrow: 'PROMO APRINTZ',
  title: '',
  description: '',
  cta_label: 'Lihat produk',
  href: '/produk',
  image_url: '',
  image_path: '',
  display_order: 0,
  is_active: false,
};

export default function AdminHomepageEditor() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerDraft, setBannerDraft] = useState<BannerDraft>(emptyBanner);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerFormOpen, setBannerFormOpen] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadContent() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/homepage');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Konten beranda gagal dimuat.');
      setBanners(data.banners ?? []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Konten beranda gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContent();
  }, []);

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreview(null);
      return;
    }
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Foto harus berformat JPG, PNG, atau WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Ukuran foto maksimal 50 MB.');
      event.target.value = '';
      return;
    }
    setError('');
    setBannerFile(file);
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.set('file', file);
    const response = await fetch('/api/admin/homepage/upload', { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Foto gagal diunggah.');
    return { image_url: data.image_url as string, image_path: data.image_path as string };
  }

  async function saveBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const image = bannerFile ? await uploadImage(bannerFile) : { image_url: bannerDraft.image_url, image_path: bannerDraft.image_path };
      if (!image.image_url || !image.image_path) throw new Error('Pilih foto banner terlebih dahulu.');
      const record = { ...bannerDraft, display_order: Number(bannerDraft.display_order), ...image };
      const response = await fetch('/api/admin/homepage', {
        method: editingBannerId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: 'banners', id: editingBannerId, record }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Banner gagal disimpan.');
      setBannerDraft(emptyBanner);
      setBannerFile(null);
      setEditingBannerId(null);
      setBannerFormOpen(false);
      setNotice('Banner beranda tersimpan.');
      await loadContent();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Banner gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function removeContent(id: string) {
    if (!window.confirm('Hapus konten ini dari beranda?')) return;
    const response = await fetch('/api/admin/homepage', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: 'banners', id }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Konten gagal dihapus.');
    else {
      setNotice('Konten dihapus.');
      await loadContent();
    }
  }

  function editBanner(banner: Banner) {
    setBannerDraft({ ...banner });
    setEditingBannerId(banner.id);
    setBannerFormOpen(true);
    setBannerFile(null);
  }

  return (
    <div className="space-y-7">
      {error && <p role="alert" className="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {loading && <p className="text-sm text-slate-500">Memuat konten beranda...</p>}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-bold text-[#12345b]">Banner carousel</h2><p className="mt-1 text-xs text-slate-500">Foto, judul, tombol, urutan, dan status publikasi promosi utama.</p></div>
          <button type="button" onClick={() => { setBannerDraft(emptyBanner); setEditingBannerId(null); setBannerFile(null); setBannerFormOpen(true); }} className="btn inline-flex items-center gap-2"><Plus size={16} /> Banner baru</button>
        </div>

        {bannerFormOpen && (
          <form onSubmit={saveBanner} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(240px,.7fr)]">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-600">Label kecil<input value={bannerDraft.eyebrow} onChange={event => setBannerDraft({ ...bannerDraft, eyebrow: event.target.value })} maxLength={80} className="field mt-1" /></label>
              <label className="text-xs font-bold text-slate-600">Urutan<input type="number" min="0" max="1000" value={bannerDraft.display_order} onChange={event => setBannerDraft({ ...bannerDraft, display_order: Number(event.target.value) })} className="field mt-1" /></label>
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">Judul<input required value={bannerDraft.title} onChange={event => setBannerDraft({ ...bannerDraft, title: event.target.value })} maxLength={140} className="field mt-1" /></label>
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">Deskripsi<textarea value={bannerDraft.description} onChange={event => setBannerDraft({ ...bannerDraft, description: event.target.value })} maxLength={300} rows={2} className="field mt-1" /></label>
              <label className="text-xs font-bold text-slate-600">Teks tombol<input required value={bannerDraft.cta_label} onChange={event => setBannerDraft({ ...bannerDraft, cta_label: event.target.value })} maxLength={50} className="field mt-1" /></label>
              <label className="text-xs font-bold text-slate-600">Link tombol<input required value={bannerDraft.href} onChange={event => setBannerDraft({ ...bannerDraft, href: event.target.value })} placeholder="/produk atau https://..." className="field mt-1" /></label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={bannerDraft.is_active} onChange={event => setBannerDraft({ ...bannerDraft, is_active: event.target.checked })} /> Tampilkan di beranda</label>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600">Foto banner · JPG, PNG, WebP · maks 50 MB<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} className="field mt-1" /></label>
              {(bannerPreview || bannerDraft.image_url) ? <img src={bannerPreview || bannerDraft.image_url} alt="Preview banner beranda" className="aspect-[16/9] w-full rounded-md border border-slate-200 object-cover" /> : <div className="grid aspect-[16/9] place-items-center rounded-md border border-dashed border-slate-300 text-slate-400"><ImagePlus size={28} /></div>}
              <div className="flex gap-2"><button disabled={saving} className="btn disabled:opacity-50">{saving ? 'Menyimpan...' : editingBannerId ? 'Simpan banner' : 'Tambah banner'}</button><button type="button" onClick={() => { setBannerFormOpen(false); setEditingBannerId(null); setBannerDraft(emptyBanner); setBannerFile(null); }} className="btn btn-outline">Batal</button></div>
            </div>
          </form>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {banners.map(banner => (
            <article key={banner.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={banner.image_url} alt={banner.title} className="aspect-[16/8] w-full bg-slate-100 object-cover" />
              <div className="p-3"><div className="flex items-start justify-between gap-3"><div><b className="text-sm text-[#12345b]">{banner.title}</b><p className="mt-1 line-clamp-2 text-xs text-slate-500">{banner.description}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${banner.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{banner.is_active ? 'Aktif' : 'Draft'}</span></div><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2"><span className="text-[11px] text-slate-500">Urutan {banner.display_order}</span><div className="flex gap-1"><button type="button" onClick={() => editBanner(banner)} aria-label="Edit banner" className="rounded p-2 text-slate-600 hover:bg-blue-50"><Pencil size={15} /></button><button type="button" onClick={() => void removeContent(banner.id)} aria-label="Hapus banner" className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></div></div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-bold text-[#12345b]">Ulasan pelanggan</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Ulasan beranda sekarang diambil otomatis dari ulasan terverifikasi di halaman produk. Admin tidak membuat ulasan manual.</p>
      </section>
    </div>
  );
}