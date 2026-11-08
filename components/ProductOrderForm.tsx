'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileArchive, FileText, Info, Lightbulb, Link2, UploadCloud } from 'lucide-react';
import { saveDesignFile } from '@/lib/design-files';

type ProductVariant = {
	id: string;
	name: string;
	unitPrice: number;
	minQuantity: number;
};

type ProductOrderFormProps = {
	product: {
		id: string;
		name: string;
		slug: string;
		price: number;
		options: string[];
		variants: ProductVariant[];
	};
};

export default function ProductOrderForm({ product }: ProductOrderFormProps) {
	const router = useRouter();
	const options = product.options.length ? product.options : ['Spesifikasi dikonfirmasi bersama CS'];
	const [option, setOption] = useState(options[0]);
	const [variantId, setVariantId] = useState(product.variants[0]?.id ?? '');
	const [quantity, setQuantity] = useState(Math.max(100, product.variants[0]?.minQuantity ?? 1));
	const [note, setNote] = useState('');
	const [designUrl, setDesignUrl] = useState('');
	const [designFile, setDesignFile] = useState<File | null>(null);
	const [designTab, setDesignTab] = useState<'file' | 'link'>('file');
	const [isDragging, setIsDragging] = useState(false);
	const [message, setMessage] = useState('');
	const [adding, setAdding] = useState(false);
	const selectedVariant = product.variants.find(variant => variant.id === variantId);
	const unitPrice = selectedVariant?.unitPrice ?? product.price;

	function chooseDesign(file: File | null) {
		setMessage('');
		if (!file) return;
		const extension = file.name.split('.').pop()?.toLowerCase();
		if (!extension || !['pdf', 'ai', 'cdr', 'psd', 'jpg', 'jpeg', 'png', 'webp', 'svg', 'zip', 'rar'].includes(extension)) {
			setMessage('Format yang diterima: PDF, AI, CDR, PSD, JPG, PNG, ZIP, atau RAR.');
			return;
		}
		if (file.size === 0 || file.size > 50 * 1024 * 1024) {
			setMessage('Ukuran maksimal 50 MB per file.');
			return;
		}
		setDesignFile(file);
		setDesignUrl('');
	}

	async function addToCart(goToCheckout: boolean) {
		setAdding(true);
		setMessage('');
		const key = crypto.randomUUID();
		try {
			if (designFile) await saveDesignFile(key, designFile);
			const storedItems: unknown = JSON.parse(localStorage.getItem('aprintz-cart') || '[]');
			const items = Array.isArray(storedItems) ? storedItems : [];
			items.push({
			key,
			productId: product.id,
			slug: product.slug,
			name: product.name,
			option: selectedVariant?.name ?? option,
			variantId: selectedVariant?.id,
			qty: quantity,
			price: unitPrice,
			note,
			designUrl: designUrl.trim() || undefined,
		});
			localStorage.setItem('aprintz-cart', JSON.stringify(items));
			router.push(goToCheckout ? '/checkout' : '/cart');
		} catch (error) {
			setMessage(error instanceof Error ? error.message : 'File desain gagal disiapkan.');
			setAdding(false);
		}
	}

	return (
		<div className="mt-8 space-y-5 border-y border-slate-200 py-6">
			<div>
				<label htmlFor="product-option" className="mb-2 block text-sm font-bold">Spesifikasi / bahan</label>
				{product.variants.length ? (
					<select
						id="product-option"
						className="field"
						value={variantId}
						onChange={event => {
							const variant = product.variants.find(item => item.id === event.target.value);
							setVariantId(event.target.value);
							if (variant) setQuantity(current => Math.max(current, variant.minQuantity));
						}}
					>
						{product.variants.map(variant => (
							<option key={variant.id} value={variant.id}>
								{variant.name} · harga indikatif per unit
							</option>
						))}
					</select>
				) : (
					<select id="product-option" className="field" value={option} onChange={event => setOption(event.target.value)}>
						{options.map(value => <option key={value}>{value}</option>)}
					</select>
				)}
			</div>
			<div className="flex items-end justify-between gap-4">
				<label htmlFor="product-quantity" className="block min-w-0 flex-1 text-sm font-bold">
					Jumlah pesanan
					<input
						id="product-quantity"
						className="field mt-2"
						type="number"
						min={selectedVariant?.minQuantity ?? 1}
						value={quantity}
						onChange={event => setQuantity(Math.max(selectedVariant?.minQuantity ?? 1, Number(event.target.value)))}
					/>
				</label>
				<div className="pb-3 text-right">
					<p className="text-xs text-slate-500">Estimasi subtotal</p>
					<p className="font-bold text-blue-700">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(unitPrice * quantity)}</p>
				</div>
			</div>
			<div>
				<label htmlFor="product-note" className="mb-2 block text-sm font-bold">Catatan khusus</label>
				<textarea
					id="product-note"
					className="field min-h-24"
					value={note}
					onChange={event => setNote(event.target.value)}
					placeholder="Ukuran khusus, finishing, tenggat, dan lainnya"
				/>
			</div>
			<section id="upload-desain" className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
				<h2 className="flex items-center gap-2 border-b-2 border-red-500 pb-4 text-xl font-black text-red-600">
					<UploadCloud size={22} /> Upload Desain
				</h2>
				<div className="mt-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
					<button type="button" onClick={() => { setDesignTab('file'); setDesignUrl(''); }} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 font-semibold transition ${designTab === 'file' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>
						<UploadCloud size={19} /> Upload File
					</button>
					<button type="button" onClick={() => { setDesignTab('link'); setDesignFile(null); }} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 font-semibold transition ${designTab === 'link' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>
						<Link2 size={19} /> Link Desain
					</button>
				</div>
				{designTab === 'file' ? (
					<div className="mt-5 grid gap-4 md:grid-cols-[1fr_0.92fr]">
						<label
							onDragOver={event => { event.preventDefault(); setIsDragging(true); }}
							onDragLeave={() => setIsDragging(false)}
							onDrop={event => { event.preventDefault(); setIsDragging(false); chooseDesign(event.dataTransfer.files[0] ?? null); }}
							className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition ${isDragging ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-50 hover:border-red-400'}`}
						>
							<UploadCloud size={34} className="text-red-500" />
							<span className="mt-3 font-bold text-slate-800">{designFile ? designFile.name : 'Drag & Drop file desain Anda di sini'}</span>
							<span className="mt-1 text-sm text-slate-500">atau klik untuk memilih file</span>
							<span className="mt-4 rounded-lg bg-red-600 px-5 py-2.5 font-bold text-white">Pilih File</span>
							<input type="file" className="sr-only" accept=".pdf,.ai,.cdr,.psd,.jpg,.jpeg,.png,.webp,.svg,.zip,.rar" onChange={event => chooseDesign(event.target.files?.[0] ?? null)} />
						</label>
						<aside className="rounded-2xl border-l-4 border-red-500 bg-red-50 p-4">
							<h3 className="flex items-center gap-2 font-bold text-red-600"><Lightbulb size={18} /> Tips Upload Desain</h3>
							<ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-slate-700">
								<li>Pastikan desain sudah siap cetak</li>
								<li>Resolusi minimal 300 DPI untuk hasil terbaik</li>
								<li>Gunakan mode warna CMYK untuk hasil akurat</li>
							</ul>
						</aside>
					</div>
				) : (
					<div className="mt-5 space-y-4">
						<label className="block text-sm font-bold text-slate-800">
							<span className="mb-2 flex items-center gap-2"><Link2 size={18} className="text-red-600" /> Link Desain</span>
							<input type="url" className="field" value={designUrl} onChange={event => { setDesignUrl(event.target.value); setDesignFile(null); }} placeholder="https://drive.google.com/... atau https://www.canva.com/..." />
						</label>
						<div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
							<h3 className="font-bold text-red-600"><Info size={16} className="mr-2 inline" />Platform yang Didukung</h3>
							<p className="mt-2"><b>Google Drive:</b> Pastikan link sharing sudah diatur ke “Anyone with the link”.</p>
							<p><b>Canva:</b> Share desain dan copy link untuk dibagikan.</p>
						</div>
						<div className="rounded-xl border-l-4 border-amber-500 bg-amber-100 p-4 text-sm leading-6 text-amber-900">
							<h3 className="font-bold text-red-600"><Info size={16} className="mr-2 inline" />Penting untuk Diperhatikan</h3>
							<ul className="mt-2 list-inside list-disc">
								<li>Pastikan link bisa diakses oleh siapa saja (public)</li>
								<li>Jangan gunakan link yang kadaluarsa atau terbatas waktu</li>
								<li>Verifikasi link sudah benar sebelum submit pesanan</li>
							</ul>
						</div>
					</div>
				)}
				{designTab === 'file' && (
					<div className="mt-5 rounded-xl bg-slate-100 p-4 text-sm leading-6 text-slate-600">
						<p className="flex items-center gap-2 font-bold"><Info size={17} className="text-red-600" /> Format yang diterima:</p>
						<p className="mt-1 pl-6">PDF, AI, CDR, PSD, JPG, PNG, ZIP, RAR</p>
						<p className="pl-6 italic">Jika file lebih dari 1 (satu), silahkan gabung dengan ZIP/RAR</p>
						<p className="mt-3 flex items-center gap-2 font-bold"><FileArchive size={16} className="text-red-600" /> Ukuran maksimal: <span className="font-normal">50 MB per file</span></p>
					</div>
				)}
				{message && <p role="alert" className="mt-3 text-sm text-red-700">{message}</p>}
				{designFile && <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><FileText size={17} /> File tersimpan untuk checkout: {designFile.name}</p>}
			</section>
			<div className="grid gap-3 sm:grid-cols-2">
				<button onClick={() => void addToCart(true)} disabled={adding} className="btn disabled:opacity-50">{adding ? 'Menyiapkan...' : 'Pesan sekarang'}</button>
				<button onClick={() => void addToCart(false)} disabled={adding} className="btn btn-outline disabled:opacity-50">{adding ? 'Menyiapkan...' : 'Tambah ke keranjang'}</button>
			</div>
			<p className="text-xs leading-5 text-slate-500">Harga akhir tetap dikonfirmasi tim APRINTZ sebelum produksi.</p>
		</div>
	);
}
