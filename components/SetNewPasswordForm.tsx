'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';

export default function SetNewPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session));
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const { error: updateError } = await createBrowserSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage('Kata sandi berhasil diperbarui. Mengarahkan ke halaman masuk...');
      window.setTimeout(() => {
        router.replace('/login');
        router.refresh();
      }, 1200);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Gagal memperbarui kata sandi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container min-h-[70vh] py-12">
      <div className="mx-auto max-w-md">
        <p className="eyebrow">APRINTZ ACCOUNT</p>
        <h1 className="mt-3 text-3xl font-black text-[#12345b]">Buat kata sandi baru</h1>
        <form onSubmit={submit} className="card mt-7 space-y-4 p-6">
          {ready ? (
            <label className="block text-sm font-bold">
              Kata sandi baru
              <input
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                className="field mt-2 font-normal"
                value={password}
                onChange={event => setPassword(event.target.value)}
              />
            </label>
          ) : (
            <p className="text-sm leading-6 text-slate-600">Buka tautan reset dari email Anda. Jika tautan tidak valid atau kedaluwarsa, minta tautan baru.</p>
          )}
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {ready && <button disabled={busy} className="btn w-full disabled:opacity-60">{busy ? 'Menyimpan...' : 'Simpan kata sandi baru'}</button>}
          {!ready && <Link href="/lupa-password" className="btn btn-outline w-full">Minta tautan reset baru</Link>}
        </form>
      </div>
    </main>
  );
}