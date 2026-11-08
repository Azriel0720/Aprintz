'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

export default function PasswordRecoveryForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const { error: requestError } = await createBrowserSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (requestError) throw requestError;
      setMessage('Jika email terdaftar, tautan reset sudah dikirim. Periksa inbox dan folder spam.');
    } catch (requestError) {
      const errorText = requestError instanceof Error ? requestError.message : '';
      if (errorText.toLowerCase().includes('rate limit')) {
        setError('Batas email Supabase tercapai. Tunggu sebelum meminta tautan reset lagi.');
      } else {
        setError(errorText || 'Gagal meminta tautan reset. Coba lagi.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container min-h-[70vh] py-12">
      <div className="mx-auto max-w-md">
        <p className="eyebrow">APRINTZ ACCOUNT</p>
        <h1 className="mt-3 text-3xl font-black text-[#12345b]">Reset kata sandi</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat kata sandi baru.</p>
        <form onSubmit={submit} className="card mt-7 space-y-4 p-6">
          <label className="block text-sm font-bold">
            Email akun
            <input
              required
              type="email"
              autoComplete="email"
              className="field mt-2 font-normal"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </label>
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="btn w-full disabled:opacity-60">{busy ? 'Mengirim...' : 'Kirim tautan reset'}</button>
          <p className="text-center text-sm"><Link href="/login" className="font-bold text-brand-700 underline">Kembali ke login</Link></p>
        </form>
      </div>
    </main>
  );
}