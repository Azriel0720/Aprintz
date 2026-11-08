import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

const questions = [
  ['Bagaimana cara memesan?', 'Pilih produk, atur spesifikasi dan jumlah, lalu kirim permintaan pesanan. Tim APRINTZ akan meninjau detail dan mengonfirmasi harga serta jadwal produksi.'],
  ['Apakah harga di katalog sudah final?', 'Harga yang tercantum merupakan harga indikatif. Harga akhir dikonfirmasi oleh tim berdasarkan spesifikasi dan kebutuhan pesanan.'],
  ['Bagaimana cara mengirim desain?', 'File PDF, PNG, JPG, WebP, atau SVG maksimal 50 MB dapat diunggah saat checkout. Panduan selengkapnya tersedia di halaman Panduan Desain.'],
  ['Bagaimana cara melacak pesanan?', 'Gunakan nomor pesanan pada halaman Lacak Pesanan untuk melihat status terbaru.'],
];

export default function HelpPage() {
  return (
    <main className="container min-h-[65vh] py-10 md:py-14">
      <p className="eyebrow">LAYANAN PELANGGAN</p>
      <h1 className="mt-2 text-3xl font-black text-[#12345b] md:text-4xl">Pusat bantuan APRINTZ</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">Temukan jawaban untuk pertanyaan umum atau hubungi tim kami untuk bantuan pesanan.</p>
      <section id="faq" className="mt-8 space-y-3">
        {questions.map(([question, answer]) => (
          <details key={question} className="rounded-lg border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer font-bold text-[#12345b]">{question}</summary>
            <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
          </details>
        ))}
      </section>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <section id="syarat" className="rounded-lg bg-slate-50 p-4"><h2 className="font-bold text-[#12345b]">Syarat & Ketentuan</h2><p className="mt-2 text-sm leading-6 text-slate-600">Permintaan pesanan baru diproses setelah spesifikasi, harga, dan jadwal dikonfirmasi oleh tim APRINTZ. Untuk ketentuan lengkap, hubungi CS sebelum melakukan pemesanan.</p></section>
        <section id="privasi" className="rounded-lg bg-slate-50 p-4"><h2 className="font-bold text-[#12345b]">Kebijakan Privasi</h2><p className="mt-2 text-sm leading-6 text-slate-600">Data kontak, alamat, dan file desain digunakan untuk membantu pemrosesan pesanan dan komunikasi terkait. Hubungi CS untuk pertanyaan atau permintaan terkait data Anda.</p></section>
        <section id="komplain" className="rounded-lg bg-slate-50 p-4"><h2 className="font-bold text-[#12345b]">Komplain & Pengembalian</h2><p className="mt-2 text-sm leading-6 text-slate-600">Sertakan nomor pesanan dan jelaskan kendala agar tim dapat membantu memeriksa pesanan Anda.</p></section>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/tracking" className="btn btn-outline">Lacak pesanan</Link>
        <a href="https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20butuh%20bantuan%20terkait%20pesanan." target="_blank" rel="noreferrer" className="btn"><MessageCircle size={16} /> Hubungi WhatsApp CS</a>
      </div>
      <div className="sr-only" id="tentang" />
    </main>
  );
}
