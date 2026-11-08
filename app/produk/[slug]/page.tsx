import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductOrderForm from '@/components/ProductOrderForm';
import ProductGallery from '@/components/ProductGallery';
import ProductRatingSummary from '@/components/ProductRatingSummary';
import ProductReviews from '@/components/ProductReviews';
import { getCatalogProduct } from '@/lib/catalog';
import { formatIDR, products } from '@/lib/products';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const databaseProduct = await getCatalogProduct(slug);
	const legacyProduct = products.find(product => product.slug === slug);
	if (!databaseProduct && !legacyProduct) notFound();

	const product = databaseProduct ?? {
		...legacyProduct!,
		imageUrl: null,
		imageAlt: legacyProduct!.name,
		images: [],
		specifications: '',
		importantNote: '',
		variants: [],
	};
	const options = databaseProduct?.options.length ? databaseProduct.options : legacyProduct?.options ?? [];

	return (
		<main className="container py-10 md:py-12">
			<div className="mb-8 text-sm text-slate-400">
				<Link href="/">Beranda</Link> / <Link href="/produk">Semua produk</Link> / <span className="text-brand-700">{product.name}</span>
			</div>
			<div className="grid gap-10 lg:grid-cols-2">
				<ProductGallery
					name={product.name}
					images={databaseProduct?.images ?? []}
				/>
				<div>
					<p className="eyebrow">{product.category}</p>
					<h1 className="mt-3 text-3xl font-black text-[#12345b] md:text-4xl">{product.name}</h1>
					<ProductRatingSummary productSlug={product.slug} />
					<p className="mt-4 leading-7 text-slate-600">{product.description}</p>
					<section className="mt-6">
						<h2 className="text-lg font-bold text-[#12345b]">Spesifikasi produk</h2>
						{product.specifications.trim() ? (
							<ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
								{product.specifications.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, index) => (
									<li key={`${line}-${index}`} className="flex gap-2"><span className="text-brand-600">•</span><span>{line.replace(/^[-•]\s*/, '')}</span></li>
								))}
							</ul>
						) : (
							<p className="mt-2 text-sm leading-6 text-slate-500">Spesifikasi tambahan produk ini sedang disiapkan.</p>
						)}
					</section>
					<aside className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
						<h2 className="text-sm font-bold text-[#12345b]">Catatan Penting tentang Warna</h2>
						<p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
							{product.importantNote.trim() || 'Warna hasil cetak mungkin sedikit berbeda dari tampilan di layar. Layar menggunakan sistem warna RGB berbasis cahaya, sedangkan printer menggunakan tinta CMYK. Tim APRINTZ akan memastikan hasil cetak tetap optimal sesuai standar kualitas.'}
						</p>
					</aside>
					<p className="mt-6 text-sm text-slate-400">Harga indikatif mulai</p>
					<p className="text-2xl font-black text-brand-700">
						{formatIDR(product.price)} <span className="text-sm font-medium text-slate-400">/ {product.unit}</span>
					</p>
					<ProductOrderForm
						product={{
							id: product.id,
							name: product.name,
							slug: product.slug,
							price: product.price,
							options,
							variants: 'variants' in product ? product.variants : [],
						}}
					/>
					<p className="mt-5 text-xs text-slate-500">File desain dapat diunggah saat checkout atau dikirim setelah konsultasi dengan tim APRINTZ.</p>
					<p className="mt-4 text-xs leading-5 text-slate-500">
						Harga akhir mengikuti variasi yang tersedia dan konfirmasi tim APRINTZ.
					</p>
				</div>
			</div>
			<section className="mt-12 border-y border-slate-200 py-7">
				<h2 className="text-lg font-bold text-[#12345b]">Cara pemesanan</h2>
				<ol className="mt-4 grid gap-3 sm:grid-cols-3">
					{[['1', 'Tentukan pilihan', 'Pilih bahan, spesifikasi, dan jumlah.'], ['2', 'Unggah desain', 'Tambahkan file saat checkout atau kirim tautan desain kepada tim.'], ['3', 'Konfirmasi pesanan', 'Tim APRINTZ meninjau detail, estimasi harga, dan jadwal produksi.']].map(([number, title, description]) => (
						<li key={number} className="rounded-lg bg-slate-50 p-4"><span className="text-sm font-black text-brand-700">{number}</span><h3 className="mt-2 font-bold text-[#12345b]">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p></li>
					))}
				</ol>
			</section>
			<ProductReviews productSlug={product.slug} />
		</main>
	);
}
