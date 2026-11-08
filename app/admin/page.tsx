import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminPage() {
	const user = await getCurrentUser();

	if (!user) redirect('/login?next=%2Fadmin');
	if (user.app_metadata?.role !== 'admin') redirect('/akun');

	return <AdminDashboard />;
}
