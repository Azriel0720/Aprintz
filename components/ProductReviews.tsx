'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import type { ProductReview } from '@/lib/product-reviews';

type Props = { productSlug: string };

export default function ProductReviews({ productSlug }: Props) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadReviews() {
    const response = await fetch(`/api/products/${encodeURIComponent(productSlug)}/reviews`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ulasan gagal dimuat.');
    setReviews(data.reviews ?? []);
    setAverage(data.average ?? 0);
    setCount(data.count ?? 0);
  }

  useEffect(() => {
    void loadReviews()
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Ulasan gagal dimuat.'))
      .finally(() => setLoading(false));
  }, [productSlug]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productSlug)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email, rating, content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ulasan gagal dikirim.');
      setOrderNumber('');
      setEmail('');
      setContent('');
      setRating(5);
      setNotice('Terima kasih, ulasan Anda sudah ditambahkan.');
      await loadReviews();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Ulasan gagal dikirim.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="ulasan-produk" className="mt-12 border-t border-slate-200 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">ULASAN PELANGGAN</p><h2 className="mt-2 text-2xl font-black text-[#12345b]">Ulasan {count > 0 && <span className="text-base font-semibold text-slate-500">({count})</span>}</h2></div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-amber-500" aria-label={count ? `Rating ${average.toFixed(1)} dari 5` : 'Belum ada rating'}>
            {Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} fill={index < Math.round(average) ? 'currentColor' : 'none'} className={index < Math.round(average) ? '' : 'text-slate-300'} />)}
          </div>
          <b className="text-lg text-[#12345b]">{count ? average.toFixed(1) : '—'}</b>
          <span className="text-sm text-slate-500">| {count} ulasan</span>
        </div>
      </div>

      <form onSubmit={submitReview} className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
        <p className="text-sm leading-6 text-slate-600 md:col-span-2">Ulasan hanya dapat dikirim oleh pelanggan dengan pesanan berstatus dalam pengiriman atau selesai. Siapkan nomor pesanan dan email yang digunakan saat checkout.</p>
        <label className="text-sm font-semibold text-slate-700">Nomor pesanan<input required maxLength={40} value={orderNumber} onChange={event => setOrderNumber(event.target.value)} className="field mt-1" placeholder="APR-2026-..." /></label>
        <label className="text-sm font-semibold text-slate-700">Email pesanan<input required type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="field mt-1" /></label>
        <label className="text-sm font-semibold text-slate-700">Rating<select value={rating} onChange={event => setRating(Number(event.target.value))} className="field mt-1">{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} bintang</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">Ulasan<textarea required minLength={8} maxLength={1200} rows={3} value={content} onChange={event => setContent(event.target.value)} className="field mt-1" placeholder="Ceritakan pengalaman Anda dengan produk ini" /></label>
        {error && <p role="alert" className="text-sm text-red-700 md:col-span-2">{error}</p>}
        {notice && <p role="status" className="text-sm text-emerald-700 md:col-span-2">{notice}</p>}
        <button disabled={saving} className="btn w-fit disabled:opacity-50 md:col-span-2">{saving ? 'Mengirim...' : 'Kirim ulasan'}</button>
      </form>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {reviews.map(review => (
          <article key={review.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-1 text-amber-500" aria-label={`Rating ${review.rating} dari 5`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < review.rating ? 'currentColor' : 'none'} className={index < review.rating ? '' : 'text-slate-300'} />)}</div>
            <p className="mt-3 text-sm leading-6 text-slate-700">“{review.content}”</p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><b className="text-sm text-[#12345b]">{review.customer_name}</b><time className="text-xs text-slate-400">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(review.created_at))}</time></div>
          </article>
        ))}
        {!loading && !reviews.length && <p className="text-sm text-slate-500 md:col-span-2">Belum ada ulasan untuk produk ini.</p>}
      </div>
    </section>
  );
}
