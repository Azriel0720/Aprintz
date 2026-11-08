import type { Metadata } from 'next';
import { Instagram, MapPin } from 'lucide-react';
import './globals.css';
import Header from '@/components/Header';
import PageTransition from '@/components/PageTransition';
import PrintingAssistant from '@/components/PrintingAssistant';

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aprintz.id'),
	title: {
		default: 'APRINTZ | Digital Printing',
		template: '%s | APRINTZ Digital Printing',
	},
	applicationName: 'APRINTZ Digital Printing',
	description: 'Pesan produk digital printing, konveksi, dan custom order secara online. Konsultasi dengan tim APRINTZ di Cikampek, Karawang.',
	openGraph: {
		type: 'website',
		locale: 'id_ID',
		siteName: 'APRINTZ | Digital Printing',
		title: 'APRINTZ | Digital Printing',
		description: 'Pesan produk digital printing, konveksi, dan custom order secara online.',
		url: '/',
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="id">
			<body>
				<Header />
				<PageTransition>{children}</PageTransition>
				<footer id="kontak" className="bg-[#102f59] text-white">
					<div className="container grid items-start gap-x-8 gap-y-7 py-8 min-[560px]:grid-cols-2 lg:grid-cols-[.9fr_.85fr_1fr_1.7fr] lg:gap-x-7 xl:gap-x-10 md:gap-y-8 md:py-9">
						<div className="max-w-sm">
							<img src="/aprintz-logo.svg" alt="APRINTZ" className="h-9 w-auto brightness-0 invert" />
							<p className="mt-2.5 text-sm leading-5 text-blue-100">Partner cetak dan produksi kreatif untuk setiap ide yang ingin diwujudkan.</p>
							<a href="https://www.instagram.com/aprintz.id/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-blue-200"><Instagram size={16} /> Instagram @aprintz.id</a>
						</div>
						<div>
							<h2 className="text-sm font-bold tracking-wide text-white">Tentang APRINTZ</h2>
							<nav aria-label="Tentang APRINTZ" className="mt-2.5 grid gap-1.5 text-sm leading-5 text-blue-100">
								<a className="transition hover:text-white" href="#lokasi-aprintz">Profil & lokasi</a>
								<a className="transition hover:text-white" href="https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20ingin%20bertanya%20tentang%20karir." target="_blank" rel="noreferrer">Karir</a>
								<a className="transition hover:text-white" href="/bantuan#faq">FAQ</a>
							</nav>
							<a aria-label="WhatsApp +62 852-8040-0225" href="https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20ingin%20konsultasi%20percetakan." target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-green-300">
								<svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
									<path d="M12.04 2a9.85 9.85 0 0 0-8.42 14.96L2.3 22l5.17-1.36A9.93 9.93 0 0 0 12.04 22h.01A10 10 0 0 0 12.04 2Zm0 18.18h-.01a8.25 8.25 0 0 1-4.2-1.15l-.3-.18-3.07.81.82-2.99-.2-.31a8.18 8.18 0 1 1 6.96 3.82Zm4.49-6.13c-.25-.13-1.48-.73-1.71-.81-.23-.08-.4-.13-.57.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.07-.13-.57-1.37-.78-1.87-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.02 2.6c.12.17 1.77 2.7 4.29 3.79.6.26 1.07.42 1.43.54.6.19 1.14.16 1.57.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.48-.29Z" />
								</svg>
								<span>+62 852-8040-0225</span>
							</a>
						</div>
						<div>
							<h2 className="text-sm font-bold tracking-wide text-white">Layanan pelanggan</h2>
							<nav aria-label="Layanan pelanggan" className="mt-2.5 grid gap-1.5 text-sm leading-5 text-blue-100">
								<a className="transition hover:text-white" href="/#cara-pesan">Cara order</a>
								<a className="transition hover:text-white" href="/panduan-desain">Panduan desain</a>
								<a className="transition hover:text-white" href="/bantuan#syarat">Syarat & ketentuan</a>
								<a className="transition hover:text-white" href="/bantuan#privasi">Kebijakan privasi</a>
								<a className="transition hover:text-white" href="/bantuan#faq">FAQ & bantuan</a>
								<a className="transition hover:text-white" href="/tracking">Lacak pesanan</a>
								<a className="transition hover:text-white" href="https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20ingin%20mengajukan%20komplain%20atau%20pengembalian." target="_blank" rel="noreferrer">Komplain & pengembalian</a>
							</nav>
						</div>
						<div id="lokasi-aprintz" className="min-w-0">
							<h2 className="text-sm font-bold tracking-wide text-white">Lokasi APRINTZ</h2>
							<p className="mt-2.5 flex gap-2 text-sm leading-5 text-blue-100"><MapPin size={16} className="mt-0.5 shrink-0 text-blue-300" /><span>Dali Coffee & Car Wash, Jl. Raya Parakan Tirtamulya Ruko No.2, Karangjaya, Kec. Kota Baru, Karawang, Jawa Barat 41372</span></p>
							<a href="https://maps.app.goo.gl/GFhGo71WKFy2mZtZ8" target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white">Buka Google Maps</a>
							<iframe title="Peta lokasi APRINTZ Karawang" src="https://www.google.com/maps?q=Dali%20Coffee%20%26%20Car%20Wash%2C%20Jl.%20Raya%20Parakan%20Tirtamulya%20Ruko%20No.2%2C%20Karangjaya%2C%20Kec.%20Kota%20Baru%2C%20Karawang%2C%20Jawa%20Barat%2041372&output=embed" className="mt-2.5 h-36 w-full rounded-lg border border-white/10 bg-white/10" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
						</div>
					</div>
					<div className="border-t border-white/10 py-3 text-center text-xs text-blue-200">© {new Date().getFullYear()} APRINTZ. All rights reserved.</div>
				</footer>
				<PrintingAssistant />
			</body>
		</html>
	);
}
