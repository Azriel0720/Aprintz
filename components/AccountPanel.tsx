'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type AccountPanelProps = {
  email: string;
  isAdmin: boolean;
};

export default function AccountPanel({ email, isAdmin }: AccountPanelProps) {
  const router = useRouter();

  async function signOut() {
    await createBrowserSupabase().auth.signOut();
    router.replace('/');
    router.refresh();
  }

  return (
    <section className="card mt-7 p-6">
      <p className="text-sm text-slate-500">Email</p>
      <p className="mt-1 font-bold text-[#12345b]">{email}</p>
      <p className="mt-4 text-sm text-slate-500">Jenis akun</p>
      <p className="mt-1 font-bold text-[#12345b]">{isAdmin ? 'Admin' : 'Pelanggan'}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {isAdmin && <Link href="/admin" className="btn">Dashboard admin</Link>}
        <button onClick={signOut} className="btn btn-outline">Keluar</button>
      </div>
    </section>
  );
}