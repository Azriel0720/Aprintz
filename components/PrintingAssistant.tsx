'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, X } from 'lucide-react';
import { formatIDR } from '@/lib/products';

type Recommendation = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  imageUrl: string | null;
  imageAlt: string;
};
type Message = {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Recommendation[];
};

const whatsappUrl = 'https://wa.me/6285280400225?text=Halo%20APRINTZ%2C%20saya%20ingin%20konsultasi%20percetakan.';

function formatMessage(content: string) {
  return content.split(/(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default function PrintingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Halo, saya CETAKI, asisten cetak APRINTZ. Saya bisa membantu memilih bahan, ukuran, finishing, menyiapkan file, dan mencari produk katalog. Apa yang ingin dicetak?' },
  ]);

  useEffect(() => {
    const footer = document.getElementById('kontak');
    if (!footer || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      setFooterVisible(entry.isIntersecting);
      if (entry.isIntersecting) setOpen(false);
    }, { rootMargin: '0px 0px -15% 0px' });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;

    const history = messages.slice(-8);
    setMessages(current => [...current, { role: 'user', content: message }]);
    setInput('');
    setBusy(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      const data = await response.json() as { reply?: string; error?: string; recommendations?: Recommendation[] };
      setMessages(current => [...current, {
        role: 'assistant',
        content: response.ok
          ? data.reply ?? 'Asisten belum mengirimkan jawaban. Coba lagi atau hubungi CS WhatsApp.'
          : `${data.error || 'Asisten tidak tersedia.'} Hubungi CS melalui WhatsApp di bawah.`,
        recommendations: response.ok ? data.recommendations : undefined,
      }]);
    } catch {
      setMessages(current => [...current, {
        role: 'assistant',
        content: 'Koneksi asisten terputus. Silakan hubungi CS melalui WhatsApp di bawah.',
      }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`fixed bottom-5 right-5 z-[60] transition duration-300 ${footerVisible ? 'pointer-events-none translate-y-4 opacity-0' : 'opacity-100'}`} aria-hidden={footerVisible}>
      {open && (
        <section className="assistant-panel-enter mb-3 flex h-[min(32rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" aria-label="Asisten konsultasi percetakan CETAKI">
          <div className="flex items-center justify-between bg-[#12345b] px-4 py-3 text-white">
            <div>
              <h2 className="font-bold">CETAKI</h2>
              <p className="text-xs text-blue-100">Panduan percetakan APRINTZ</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Tutup chat" className="rounded p-1 hover:bg-white/10"><X size={20} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'ml-auto max-w-[90%]' : 'max-w-[96%]'}>
                <p className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-5 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {formatMessage(message.content)}
                </p>
                {message.recommendations?.length ? (
                  <div className="mt-2 grid gap-2">
                    {message.recommendations.map(product => (
                      <Link key={product.id} href={`/produk/${product.slug}`} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-blue-300 hover:bg-blue-50">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                          {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.imageAlt} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            : <div className="grid h-full place-items-center text-[10px] font-semibold text-slate-400">APRINTZ</div>}
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{product.category}</span>
                          <span className="mt-0.5 block line-clamp-2 text-xs font-bold leading-4 text-[#12345b]">{product.name}</span>
                          <span className="mt-1 block text-xs font-bold text-blue-700">{formatIDR(product.price)} <span className="font-normal text-slate-500">/ {product.unit}</span></span>
                        </span>
                        <span aria-hidden="true" className="pr-1 text-lg text-blue-600 transition-transform group-hover:translate-x-0.5">›</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {busy && <p className="text-sm text-slate-500">Menyiapkan jawaban...</p>}
          </div>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="border-t px-4 py-2 text-center text-xs font-bold text-green-700 hover:bg-green-50">
            Lanjut ke WhatsApp CS · +62 852-8040-0225
          </a>
          <form onSubmit={sendMessage} className="flex gap-2 border-t p-3">
            <input
              aria-label="Tulis pertanyaan percetakan"
              className="field min-w-0 flex-1"
              maxLength={800}
              placeholder="Tanya bahan, ukuran, finishing..."
              value={input}
              onChange={event => setInput(event.target.value)}
            />
            <button disabled={busy || input.trim().length < 2} aria-label="Kirim pertanyaan" className="rounded-lg bg-blue-600 px-3 text-white disabled:opacity-50">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
      <button
        onClick={() => setOpen(value => !value)}
        aria-label={open ? 'Tutup konsultasi cetak' : 'Buka konsultasi cetak'}
        aria-expanded={open}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}