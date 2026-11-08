# APRINTZ Commerce

Aplikasi pemesanan printing/konveksi dengan Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, dan Supabase PostgreSQL.

## Fitur
- Katalog, detail produk, keranjang, checkout, dan pelacakan order.
- Detail produk dengan galeri foto, spesifikasi/catatan yang dikelola admin, dan ulasan pelanggan terverifikasi untuk pesanan yang sedang dikirim atau selesai.
- Link desain per produk diteruskan ke dashboard admin; galeri produk mendukung hingga 20 foto.
- Upload desain checkout mendukung PDF, AI, CDR, PSD, JPG, PNG, WebP, SVG, ZIP, dan RAR (maksimal 50 MB).
- Footer bantuan dan peta lokasi APRINTZ di Karawang.
- Pelanggan dapat menjelajah dan checkout tanpa login, atau membuat akun opsional.
- Admin dan pelanggan masuk melalui website yang sama; halaman serta API admin memerlukan role admin.
- Dashboard order dengan jumlah yang perlu ditinjau dan grafik nilai estimasi order.
- Konsultasi WhatsApp di `+62 852-8040-0225` dan chat asisten percetakan.
- Pembayaran dan penarikan saldo belum terintegrasi.

## Menjalankan secara lokal
1. Install Node.js 20+ dan jalankan `npm install`.
2. Salin `.env.example` menjadi `.env.local`.
3. Isi URL Supabase, publishable/anon key, dan service role/secret key. `NEXT_PUBLIC_SITE_URL` memakai domain produksi `https://aprintz.id`; untuk lokal, ubah ke URL localhost yang sedang digunakan.
4. Jalankan isi `supabase/schema.sql` di Supabase SQL Editor.
5. Untuk database baru maupun yang sudah berjalan, jalankan migration secara berurutan di Supabase SQL Editor: `20261108030000_product_content_reviews.sql`, `20261108040000_seed_reference_catalog.sql`, `20261108050000_update_catalog_prices_and_products.sql`, `20261108060000_home_product_display_flags.sql`, `20261108070000_order_item_design_url.sql`, lalu `20261108080000_printing_assistant_knowledge_and_product_edit.sql`. Migration terakhir menambahkan kolom spesifikasi produk dan 25 panduan percetakan untuk CETAKI. Harga dan status produk tetap dapat dikelola admin; CETAKI mengambil referensi produk aktif langsung dari katalog. Migration pilihan beranda mengatur produk umum; best seller dapat ditandai admin. Katalog menampilkan maksimal 12 produk per halaman.
6. CETAKI tetap dapat menjawab dari basis pengetahuan Supabase tanpa konfigurasi AI eksternal. Untuk jawaban generatif gratis melalui Gemini, tambahkan `GEMINI_API_KEY` dari Google AI Studio ke `.env.local`. Gemini diprioritaskan bila key tersebut tersedia; model default `gemini-3.5-flash-lite` dapat diubah lewat `GEMINI_MODEL`. Alternatifnya, tambahkan `OPENAI_API_KEY`. Semua key hanya dipakai server-side. Restart server setelah mengubah `.env.local`.
7. Jalankan `npm run dev`.

## Mengaktifkan akun admin
1. Buat akun melalui `/daftar` menggunakan email admin yang Anda kuasai.
2. Jalankan query berikut di Supabase SQL Editor, ganti email contoh dengan email admin tersebut:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
```

3. Keluar lalu masuk kembali melalui `/login`. Akun tanpa role admin dianggap sebagai pelanggan.

## Catatan keamanan dan data
- Role admin disimpan di `app_metadata`, bukan metadata yang dapat diedit pengguna.
- Jangan pernah menaruh service role/secret key, Gemini API key, atau OpenAI API key di variabel `NEXT_PUBLIC_*` atau kode browser.
- Nilai order adalah estimasi; bukan pembayaran yang sudah diterima. Dashboard belum menampilkan saldo yang dapat ditarik karena payment gateway dan pencatatan payout belum tersedia.
- Harga katalog saat ini adalah data awal dan perlu dikonfirmasi APRINTZ.
- Sebelum produksi, siapkan RLS, pembatasan/rate limit API, kebijakan pembayaran, audit log, dan uji keamanan.
- Domain `aprintz.id` harus dimiliki, diarahkan lewat DNS ke hosting, dan ditambahkan ke Supabase Auth redirect URLs sebelum alamat tersebut bisa dibuka publik.

## Rute
- `/` — katalog dan storefront
- `/login` dan `/daftar` — masuk atau buat akun pelanggan/admin
- `/akun` — akun pelanggan
- `/produk/[slug]`, `/cart`, `/checkout`, `/tracking`
- `/panduan-desain` dan `/bantuan` — bantuan pelanggan
- `/admin` — dashboard khusus role admin
- `POST /api/chat` — asisten konsultasi percetakan (mendukung `GEMINI_API_KEY` atau `OPENAI_API_KEY`; fallback ke basis pengetahuan Supabase)
- `POST /api/orders`, `GET /api/orders?code=...`
- `GET, POST /api/products/[slug]/reviews` — membaca dan mengirim ulasan terverifikasi per produk
- `GET /api/admin/orders`, `PATCH /api/admin/orders/[id]` — khusus role admin
