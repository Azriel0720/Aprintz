'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Instagram, LayoutDashboard, LogIn, LogOut, MapPin, Menu, MessageCircle, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { isHiddenPublicCategory } from '@/lib/catalog-visibility';

type CategoryLink = { id: string; slug: string; name: string };

export default function Header() {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [categories, setCategories] = useState<CategoryLink[]>([]);
	const isAdmin = user?.app_metadata?.role === 'admin';

	useEffect(() => {
		const supabase = createBrowserSupabase();
		void supabase.auth.getUser().then(({ data }) => setUser(data.user));
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});
		if (pathname !== '/admin') {
			void supabase
				.from('categories')
				.select('id,slug,name')
				.eq('is_active', true)
				.order('display_order')
				.then(({ data }) => setCategories((data ?? []).filter(category => !isHiddenPublicCategory(category.slug, category.name))));
		}
		return () => subscription.unsubscribe();
	}, [pathname]);

	async function signOut() {
		await createBrowserSupabase().auth.signOut();
		setOpen(false);
	}

	if (pathname === '/admin') {
		return (
			<header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
				<div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-3 md:px-7">
					<Link href="/admin" aria-label="APRINTZ admin" className="shrink-0">
						<img src="/aprintz-logo.svg" alt="APRINTZ" className="h-9 w-auto" />
					</Link>
					<span className="hidden flex-1 border-l border-slate-200 pl-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 sm:block">Production operations</span>
					<button onClick={signOut} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
						<LogOut size={16} /> Keluar
					</button>
				</div>
			</header>
		);
	}

	return (
		<header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
			<div className="hidden bg-[#12345b] text-white sm:block">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-1.5 text-[11px] font-semibold">
					<span className="text-blue-100">Digital printing & produksi custom · Cikampek, Karawang</span>
					<div className="flex items-center gap-5">
						<Link href="/#cara-pesan" className="hover:text-blue-200">Cara order</Link>
						<Link href="/tracking" className="hover:text-blue-200">Lacak pesanan</Link>
						<a href="https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20ingin%20konsultasi%20percetakan." target="_blank" rel="noreferrer" className="hover:text-blue-200">Bantuan CS</a>
					</div>
				</div>
			</div>
			<div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
				<Link href="/" aria-label="APRINTZ Digital Printing, beranda" className="shrink-0">
					<img src="/aprintz-logo.svg" alt="APRINTZ" className="h-10 w-auto md:h-12" />
				</Link>
				<form action="/produk" className="hidden min-w-48 max-w-md flex-1 sm:flex">
					<label className="relative min-w-0 flex-1">
						<span className="sr-only">Cari produk</span>
						<Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
						<input name="q" className="field py-2.5 pl-10" placeholder="Cari produk percetakan" />
					</label>
				</form>
				<div className="hidden items-center gap-3 md:flex">
					<span className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
						<MapPin size={14} /> Cikampek
					</span>
					<a
						href="https://www.instagram.com/aprintz.id/"
						target="_blank"
						rel="noreferrer"
						aria-label="Instagram APRINTZ"
						title="Instagram APRINTZ"
						className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-pink-600"
					>
						<Instagram size={19} />
					</a>
					<a
						href="https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20ingin%20konsultasi%20percetakan."
						target="_blank"
						rel="noreferrer"
						className="btn btn-outline gap-2"
					>
						<MessageCircle size={16} /> WhatsApp CS
					</a>
					{user ? (
						<>
							{isAdmin && <Link href="/admin" className="btn btn-outline gap-2"><LayoutDashboard size={16} /> Admin</Link>}
							<Link href="/akun" className="btn btn-outline gap-2"><UserRound size={16} /> Akun</Link>
							<button onClick={signOut} title="Keluar" aria-label="Keluar" className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><LogOut size={18} /></button>
						</>
					) : (
						<Link href="/login" className="btn btn-outline gap-2"><LogIn size={16} /> Masuk</Link>
					)}
					<Link href="/cart" aria-label="Keranjang" className="rounded-full bg-brand-600 p-3 text-white hover:bg-brand-700"><ShoppingBag size={17} /></Link>
				</div>
				<button onClick={() => setOpen(!open)} className="md:hidden" aria-label="Menu" aria-expanded={open}>
					{open ? <X /> : <Menu />}
				</button>
			</div>
			<nav aria-label="Navigasi utama" className="hidden items-center gap-7 border-t border-[#315275] bg-[#12345b] px-5 py-2.5 text-sm font-semibold text-white lg:flex lg:justify-center">
				<Link href="/">Beranda</Link>
				<Link href="/produk">Semua Produk</Link>
				<Link href="/#promo">Promo</Link>
				<Link href="/#ulasan">Ulasan</Link>
				<details className="relative">
					<summary className="cursor-pointer list-none">Kategori</summary>
					<div className="absolute left-0 top-full z-50 mt-3 grid w-64 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
						{categories.length ? categories.map(category => (
							<Link key={category.id} href={`/kategori/${category.slug}`} className="rounded px-3 py-2 hover:bg-slate-50">{category.name}</Link>
						)) : <Link href="/produk" className="rounded px-3 py-2 text-slate-500 hover:bg-slate-50">Lihat katalog</Link>}
					</div>
				</details>
				<Link href="/#cara-pesan">Cara Pesan</Link>
				<Link href="/tracking">Lacak Pesanan</Link>
				<Link href="/#kontak">Kontak & Bantuan</Link>
			</nav>
			{open && (
				<nav className="grid gap-4 border-t px-5 py-5 text-sm font-semibold md:hidden">
					<form action="/produk" className="flex">
						<label className="relative min-w-0 flex-1">
							<span className="sr-only">Cari produk</span>
							<Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<input name="q" className="field pl-10" placeholder="Cari produk percetakan" />
						</label>
					</form>
					<Link onClick={() => setOpen(false)} href="/">Beranda</Link>
					<Link onClick={() => setOpen(false)} href="/produk">Semua Produk</Link>
					<Link onClick={() => setOpen(false)} href="/#promo">Promo</Link>
					<Link onClick={() => setOpen(false)} href="/#ulasan">Ulasan</Link>
					{categories.map(category => <Link key={category.id} onClick={() => setOpen(false)} href={`/kategori/${category.slug}`}>{category.name}</Link>)}
					<Link onClick={() => setOpen(false)} href="/#cara-pesan">Cara Pesan</Link>
					<Link onClick={() => setOpen(false)} href="/tracking">Lacak Pesanan</Link>
					<Link onClick={() => setOpen(false)} href="/cart">Keranjang</Link>
					<a
						href="https://www.instagram.com/aprintz.id/"
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-2"
					>
						<Instagram size={17} /> Instagram @aprintz.id
					</a>
					<a
						href="https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20ingin%20konsultasi%20percetakan."
						target="_blank"
						rel="noreferrer"
					>
						WhatsApp CS: +62 852-8040-0225
					</a>
					{user ? (
						<>
							{isAdmin && <Link onClick={() => setOpen(false)} href="/admin">Dashboard admin</Link>}
							<Link onClick={() => setOpen(false)} href="/akun">Akun saya</Link>
							<button onClick={signOut} className="text-left">Keluar</button>
						</>
					) : <Link onClick={() => setOpen(false)} href="/login">Masuk / Daftar</Link>}
				</nav>
			)}
		</header>
	);
}
