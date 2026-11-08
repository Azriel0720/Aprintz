import Link from 'next/link';
import { ArrowRight, FileImage, FileText } from 'lucide-react';

export default function DesignGuidePage() {
  return (
    <main className="container min-h-[65vh] py-10 md:py-14">
      <p className="eyebrow">BANTUAN APRINTZ</p>
      <h1 className="mt-2 text-3xl font-black text-[#12345b] md:text-4xl">Panduan file desain</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">Siapkan file desain sebelum memesan agar tim kami dapat memeriksa kebutuhan produksi dengan lebih mudah.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <FileText className="text-brand-600" size={24} />
          <h2 className="mt-3 font-bold text-[#12345b]">Format dan ukuran file</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Format yang diterima: PDF, AI, CDR, PSD, JPG, PNG, WebP, SVG, ZIP, atau RAR.</li>
            <li>Ukuran maksimal 50 MB per file.</li>
            <li>Pastikan ukuran halaman dan area potong sudah sesuai pesanan.</li>
          </ul>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <FileImage className="text-brand-600" size={24} />
          <h2 className="mt-3 font-bold text-[#12345b]">Kualitas cetak</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Gunakan gambar beresolusi tinggi; 300 DPI disarankan untuk hasil yang tajam.</li>
            <li>Untuk file cetak, gunakan mode warna CMYK jika tersedia.</li>
            <li>Warna pada layar dapat sedikit berbeda dari hasil cetak.</li>
            <li>Jika beberapa file perlu dikirim sekaligus, gabungkan dalam ZIP atau RAR.</li>
          </ul>
        </section>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/produk" className="btn">Pilih produk <ArrowRight size={16} /></Link>
        <a href="https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20ingin%20konsultasi%20file%20desain." target="_blank" rel="noreferrer" className="btn btn-outline">Tanya tim APRINTZ</a>
      </div>
    </main>
  );
}
