import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { isHiddenPublicCategory } from '@/lib/catalog-visibility';

const schema = z.object({
  message: z.string().trim().min(2).max(800),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000),
  })).max(8).optional(),
});

const instructions = `Kamu adalah CETAKI, asisten konsultasi percetakan APRINTZ di Cikampek. Jawab dalam bahasa Indonesia dengan ramah, jelas, dan praktis. Gunakan hanya panduan percetakan dan data katalog yang diberikan. Jangan mengarang harga, stok, waktu produksi, ongkir, ketahanan bahan, atau status order; harga katalog adalah harga dasar dan perlu konfirmasi. Tanyakan detail yang masih kurang seperti ukuran, kuantitas, tujuan pemakaian, finishing, dan tenggat. Jika ditanya membuat desain, tawarkan bantuan menyusun konsep, teks, arahan tata letak, atau brief desain, tetapi jelaskan bahwa chat ini belum dapat menghasilkan file visual siap cetak; untuk layanan desain final, arahkan pelanggan mengonfirmasi ke CS tanpa menjanjikan ketersediaan layanan. Jangan meminta kata sandi, API key, atau data pembayaran. Untuk hal di luar percetakan/APRINTZ, arahkan dengan sopan ke CS WhatsApp +62 852-8040-0225.`;

const stopWords = new Set([
  'apa', 'apakah', 'bagaimana', 'berapa', 'yang', 'dan', 'atau', 'untuk', 'dengan',
  'dari', 'ini', 'itu', 'saya', 'aku', 'mau', 'ingin', 'bisa', 'tolong', 'dong',
  'ya', 'kah', 'nya', 'di', 'ke', 'buat', 'ada', 'jual', 'cetak', 'aprintz',
]);

function getTerms(text: string) {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(term => term.length > 1 && !stopWords.has(term)) ?? [];
}

function scoreMatch(terms: string[], text: string) {
  const normalized = text.toLowerCase();
  return terms.reduce((score, term) => score + (normalized.includes(term) ? Math.min(term.length, 8) : 0), 0);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Format pesan tidak valid.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Pesan tidak valid atau terlalu panjang.' }, { status: 400 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Basis data asisten belum dikonfigurasi. Silakan hubungi CS WhatsApp.' }, { status: 503 });
  }

  const { data: knowledge, error: knowledgeError } = await supabase
    .from('printing_knowledge')
    .select('category,title,keywords,content')
    .eq('is_active', true)
    .limit(100);
  if (knowledgeError) {
    console.error('Failed to load printing assistant knowledge:', knowledgeError);
    return NextResponse.json({ error: 'Panduan asisten belum dapat dimuat. Silakan hubungi CS WhatsApp.' }, { status: 503 });
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id,slug,name,category,description,base_price,unit,specifications,important_note')
    .eq('is_active', true)
    .limit(500);
  if (productsError) {
    console.error('Failed to load catalog for printing assistant:', productsError);
    return NextResponse.json({ error: 'Katalog asisten belum dapat dimuat. Silakan hubungi CS WhatsApp.' }, { status: 503 });
  }

  const terms = getTerms(parsed.data.message);
  const relevantKnowledge = (knowledge ?? [])
    .map(item => ({
      item,
      score: scoreMatch(terms, `${item.category} ${item.title} ${item.keywords.join(' ')} ${item.content}`),
    }))
    .filter(result => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(result => result.item);
  const relevantProducts = (products ?? [])
    .filter(product => !isHiddenPublicCategory(null, product.category))
    .map(product => ({
      product,
      score: scoreMatch(terms, product.name) * 4
        + scoreMatch(terms, `${product.description ?? ''} ${product.specifications ?? ''}`)
        + scoreMatch(terms, product.category),
    }))
    .filter(result => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map(result => result.product);
  const recommendationIds = relevantProducts.map(product => product.id);
  const { data: productImages, error: productImagesError } = recommendationIds.length
    ? await supabase
        .from('product_images')
        .select('product_id,image_url,alt_text,display_order')
        .in('product_id', recommendationIds)
        .order('display_order')
    : { data: [], error: null };
  if (productImagesError) console.error('Failed to load CETAKI recommendation images:', productImagesError);

  const recommendations = relevantProducts.map(product => {
    const image = productImages?.find(productImage => productImage.product_id === product.id);
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      price: Number(product.base_price),
      unit: product.unit,
      imageUrl: image?.image_url ?? null,
      imageAlt: image?.alt_text || product.name,
    };
  });

  const context = [
    'PANDUAN CETAK DARI BASIS DATA APRINTZ:',
    ...(relevantKnowledge.length
      ? relevantKnowledge.map(item => `- ${item.title}: ${item.content}`)
      : ['Belum ada artikel yang cocok. Tanyakan kebutuhan secara spesifik dan jangan menebak.']),
    'PRODUK KATALOG YANG COCOK:',
    ...(relevantProducts.length
      ? relevantProducts.map(product => `- ${product.name} (${product.category}), harga dasar ${formatPrice(Number(product.base_price))}/${product.unit}. ${product.description ?? ''} ${product.specifications ?? ''} ${product.important_note ?? ''}`.trim())
      : ['Tidak ada produk yang cukup cocok untuk disebutkan.']),
  ].join('\n');

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (!geminiApiKey && !openAiApiKey) {
    if (!relevantKnowledge.length && !relevantProducts.length) {
      return NextResponse.json({
        reply: 'Saya CETAKI, asisten percetakan APRINTZ. Saya belum menemukan panduan yang cocok. Boleh ceritakan jenis produk, ukuran, jumlah, dan tujuan pemakaiannya? Tim CS juga bisa membantu di WhatsApp +62 852-8040-0225.',
        mode: 'database',
      });
    }

    const reply = [
      relevantProducts.length
        ? `Produk katalog yang mungkin sesuai:\n${relevantProducts.map(product => `• ${product.name} — ${formatPrice(Number(product.base_price))}/${product.unit}`).join('\n')}`
        : '',
      ...relevantKnowledge.map(item => `${item.title}: ${item.content}`),
      'Harga dan spesifikasi akhir dikonfirmasi tim APRINTZ. Jika berkenan, kirim ukuran, jumlah, bahan/tujuan penggunaan, finishing, dan tenggat agar saya bisa mengarahkan lebih tepat.',
    ].filter(Boolean).join('\n\n');

    return NextResponse.json({ reply, mode: 'database', recommendations });
  }

  const history = (parsed.data.history ?? []).slice(-8);
  let response: Response;
  try {
    if (geminiApiKey) {
      const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: {
          'x-goog-api-key': geminiApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `${instructions}\n\nJika katalog menyediakan produk yang cocok, berikan pengantar singkat dan jangan menuliskan daftar nama serta harga produk karena aplikasi akan menampilkan kartu produk. Jangan membuat rekomendasi produk yang tidak ada pada konteks.\n\n${context}` }],
          },
          contents: [
            ...history.map(({ role, content }) => ({
              role: role === 'assistant' ? 'model' : 'user',
              parts: [{ text: content }],
            })),
            { role: 'user', parts: [{ text: parsed.data.message }] },
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.4,
          },
        }),
        signal: AbortSignal.timeout(20000),
      });
    } else {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `${instructions}\n\nJika katalog menyediakan produk yang cocok, berikan pengantar singkat dan jangan menuliskan daftar nama serta harga produk karena aplikasi akan menampilkan kartu produk. Jangan membuat rekomendasi produk yang tidak ada pada konteks.\n\n${context}` },
            ...history,
            { role: 'user', content: parsed.data.message },
          ],
          max_tokens: 500,
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(20000),
      });
    }
  } catch (error) {
    console.error('Printing assistant provider request failed:', error);
    return NextResponse.json({ error: 'Koneksi asisten sedang bermasalah. Coba lagi atau hubungi CS WhatsApp.' }, { status: 502 });
  }

  let result: {
    error?: { code?: string; type?: string; status?: string };
    choices?: { message?: { content?: unknown } }[];
    candidates?: { content?: { parts?: { text?: unknown }[] } }[];
  };
  try {
    result = await response.json();
  } catch {
    return NextResponse.json({ error: 'Asisten mengembalikan respons yang tidak valid. Coba lagi.' }, { status: 502 });
  }
  if (!response.ok) {
    const providerError = result.error;
    console.error('Printing assistant provider returned HTTP', response.status, providerError?.code ?? providerError?.status ?? providerError?.type ?? 'unknown');
    if (geminiApiKey && response.status === 429) {
      return NextResponse.json({ error: 'Batas penggunaan Gemini gratis tercapai. Tunggu sebentar atau periksa kuota Google AI Studio.' }, { status: 503 });
    }
    if (geminiApiKey && (response.status === 400 || response.status === 403)) {
      return NextResponse.json({ error: 'Gemini menolak permintaan. Periksa key, model GEMINI_MODEL, dan akses API pada Google AI Studio.' }, { status: 503 });
    }
    if (!geminiApiKey && (providerError?.code === 'insufficient_quota' || providerError?.code === 'credit_balance_exhausted')) {
      return NextResponse.json({
        error: 'Saldo kredit OpenAI API habis. Isi saldo di platform.openai.com/settings/organization/billing, lalu coba lagi.',
      }, { status: 503 });
    }
    if (response.status === 429) {
      return NextResponse.json({ error: 'Batas permintaan AI tercapai. Tunggu sebentar lalu coba lagi.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Asisten sedang tidak tersedia. Coba lagi atau hubungi CS WhatsApp.' }, { status: 502 });
  }

  const reply = geminiApiKey
    ? result.candidates?.[0]?.content?.parts?.map(part => part.text).filter((text): text is string => typeof text === 'string').join('\n')
    : result.choices?.[0]?.message?.content;
  if (typeof reply !== 'string' || !reply.trim()) {
    return NextResponse.json({ error: 'Asisten belum dapat menjawab. Coba ulangi pertanyaan.' }, { status: 502 });
  }

  return NextResponse.json({ reply, mode: geminiApiKey ? 'gemini' : 'openai', recommendations });
}
