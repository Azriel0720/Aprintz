import { redirect } from 'next/navigation';
import AccountPanel from '@/components/AccountPanel';
import { getCurrentUser } from '@/lib/auth';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=%2Fakun');

  return (
    <main className="container min-h-[70vh] py-12">
      <p className="eyebrow">APRINTZ ACCOUNT</p>
      <h1 className="mt-3 text-3xl font-black text-[#12345b]">Akun saya</h1>
      <p className="mt-2 text-sm text-slate-500">Anda tetap dapat melihat produk dan membuat pesanan seperti biasa.</p>
      <AccountPanel email={user.email ?? '-'} isAdmin={user.app_metadata?.role === 'admin'} />
    </main>
  );
}