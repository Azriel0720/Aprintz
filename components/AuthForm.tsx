'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type AuthFormProps = {
  mode: 'login' | 'register';
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const isLogin = mode === 'login';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const supabase = createBrowserSupabase();

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const nextPath = new URLSearchParams(window.location.search).get('next');
        const safeNextPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';
        const destination = data.user.app_metadata?.role === 'admin' ? '/admin' : safeNextPath;
        router.replace(destination);
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (!data.session) {
        setMessage('Pendaftaran diterima. Periksa email untuk konfirmasi akun sebelum masuk.');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch (error) {
      const errorText = error instanceof Error ? error.message : '';
      if (errorText.toLowerCase().includes('rate limit')) {
        setMessage('Batas email Supabase tercapai. Tunggu sebelum mencoba lagi atau hubungi CS.');
      } else if (isLogin && errorText.toLowerCase().includes('invalid login credentials')) {
        setMessage('Email atau kata sandi tidak cocok. Pastikan akun sudah terdaftar, atau gunakan Lupa kata sandi.');
      } else if (errorText.toLowerCase().includes('email not confirmed')) {
        setMessage('Email belum dikonfirmasi. Periksa inbox atau folder spam Anda.');
      } else {
        setMessage(errorText || 'Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container min-h-[70vh] py-12">
      <div className="mx-auto max-w-md">
        <p className="eyebrow">APRINTZ ACCOUNT</p>
        <h1 className="mt-3 text-3xl font-black text-[#12345b]">
          {isLogin ? 'Masuk ke akun' : 'Daftar pelanggan'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isLogin ? 'Masuk sebagai pelanggan atau admin.' : 'Buat akun pelanggan APRINTZ.'}
        </p>

        <form onSubmit={submit} className="card mt-7 space-y-4 p-6">
          <label className="block text-sm font-bold">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              className="field mt-2 font-normal"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm font-bold">
            Kata sandi
            <input
              required
              type="password"
              minLength={8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="field mt-2 font-normal"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </label>
          {isLogin && (
            <div className="text-right">
              <Link className="text-sm font-semibold text-brand-700 underline" href="/lupa-password">Lupa kata sandi?</Link>
            </div>
          )}
          {message && <p role="status" className="text-sm text-red-600">{message}</p>}
          <button disabled={busy} className="btn w-full disabled:opacity-60">
            {busy ? 'Memproses...' : isLogin ? 'Masuk' : 'Buat akun'}
          </button>
          <p className="text-center text-sm text-slate-500">
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <Link className="font-bold text-brand-700 underline" href={isLogin ? '/daftar' : '/login'}>
              {isLogin ? 'Daftar' : 'Masuk'}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}