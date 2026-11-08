-- Seed the customer-provided catalog as provisional APRINTZ listings.
-- Competitor photos, ratings, review counts, and descriptions are intentionally not imported.

update public.categories as category
set name = names.display_name
from (values
  ('print-on-paper', 'Print On Paper'),
  ('print-sticker', 'Print Sticker'),
  ('kalender', 'Kalender'),
  ('spanduk-banner', 'Spanduk & Banner'),
  ('large-format', 'Large Format'),
  ('perlengkapan-bisnis', 'Perlengkapan Bisnis'),
  ('photography', 'Photography'),
  ('merchandise', 'Merchandise'),
  ('offset-printing', 'Offset Printing'),
  ('packaging', 'Packaging')
) as names(slug, display_name)
where category.slug = names.slug;

update public.products as product
set category = category.name
from public.categories as category
where product.category_id = category.id;

with incoming(name, slug, category_slug, base_price, unit) as (
  values
    ('Print A3+ Color', 'print-a3-plus-color', 'print-on-paper', 2500, 'lembar'),
    ('Buku dan Majalah', 'buku-dan-majalah', 'offset-printing', 10000, 'pcs'),
    ('Print A3+ Black White', 'print-a3-plus-black-white', 'print-on-paper', 1500, 'lembar'),
    ('Long Print (65 x 32,4 cm)', 'long-print-65-x-32-4-cm', 'print-on-paper', 8000, 'lembar'),
    ('Flyer 10x21', 'flyer-10x21', 'print-on-paper', 230000, 'paket'),
    ('Flyer 21x21', 'flyer-21x21', 'print-on-paper', 550000, 'paket'),
    ('Brosur A6', 'brosur-a6', 'print-on-paper', 175000, 'paket'),
    ('Brosur A5', 'brosur-a5', 'print-on-paper', 275000, 'paket'),
    ('Brosur A4', 'brosur-a4', 'print-on-paper', 550000, 'paket'),
    ('Brosur A3', 'brosur-a3', 'print-on-paper', 1100000, 'paket'),
    ('Kartu Nama Standart', 'kartu-nama-standart', 'perlengkapan-bisnis', 15000, 'box'),
    ('Kartu Nama Hook', 'kartu-nama-hook', 'perlengkapan-bisnis', 25500, 'box'),
    ('Kartu Nama Pola', 'kartu-nama-pola', 'perlengkapan-bisnis', 61000, 'box'),
    ('Kartu Nama Lipat', 'kartu-nama-lipat', 'perlengkapan-bisnis', 61000, 'box'),
    ('Thanks Card - 9 x 5,5 cm', 'thanks-card-9-x-5-5-cm', 'offset-printing', 400, 'pcs'),
    ('Thanks Card - 9 x 9 cm', 'thanks-card-9-x-9-cm', 'offset-printing', 650, 'pcs'),
    ('Thanks Card - 14,5 x 10,5 cm', 'thanks-card-14-5-x-10-5-cm', 'offset-printing', 1250, 'pcs'),
    ('Thanks Card - 14 x 14 cm', 'thanks-card-14-x-14-cm', 'offset-printing', 1400, 'pcs'),
    ('Co Card - 5,5 x 8,5 cm', 'co-card-5-5-x-8-5-cm', 'perlengkapan-bisnis', 600, 'pcs'),
    ('Co Card - 7 x 10,5 cm', 'co-card-7-x-10-5-cm', 'perlengkapan-bisnis', 800, 'pcs'),
    ('Co Card - 8,5 x 10,5 cm', 'co-card-8-5-x-10-5-cm', 'perlengkapan-bisnis', 860, 'pcs'),
    ('Co Card - 9,5 x 13,5 cm', 'co-card-9-5-x-13-5-cm', 'perlengkapan-bisnis', 1000, 'pcs'),
    ('Co Card - 14,8 x 21 cm', 'co-card-14-8-x-21-cm', 'perlengkapan-bisnis', 2000, 'pcs'),
    ('Hang Tag - 3,5 x 5 cm', 'hang-tag-3-5-x-5-cm', 'perlengkapan-bisnis', 235, 'pcs'),
    ('Hang Tag - 3,5 x 7 cm', 'hang-tag-3-5-x-7-cm', 'perlengkapan-bisnis', 345, 'pcs'),
    ('Hang Tag - 4 x 4 cm', 'hang-tag-4-x-4-cm', 'perlengkapan-bisnis', 215, 'pcs'),
    ('Hang Tag - 4 x 7 cm', 'hang-tag-4-x-7-cm', 'perlengkapan-bisnis', 335, 'pcs'),
    ('Hang Tag - 4 x 9 cm', 'hang-tag-4-x-9-cm', 'perlengkapan-bisnis', 500, 'pcs'),
    ('Notebook A6 - 10,5 x 14,8 cm', 'notebook-a6-10-5-x-14-8-cm', 'merchandise', 6250, 'pcs'),
    ('Notebook A5 - 14,8 x 21 cm', 'notebook-a5-14-8-x-21-cm', 'merchandise', 9000, 'pcs'),
    ('Notebook A4 - 21 x 29,7 cm', 'notebook-a4-21-x-29-7-cm', 'merchandise', 13500, 'pcs'),
    ('Buku Yasin Soft Cover', 'buku-yasin-soft-cover', 'merchandise', 13500, 'pcs'),
    ('Buku Yasin Hard Cover Bludru', 'buku-yasin-hard-cover-bludru', 'merchandise', 38500, 'pcs'),
    ('Buku Yasin Hard Cover Kuning', 'buku-yasin-hard-cover-kuning', 'merchandise', 28000, 'pcs'),
    ('Buku Yasin Hard Cover Hijau', 'buku-yasin-hard-cover-hijau', 'merchandise', 33000, 'pcs'),
    ('Sertifikat - Piagam', 'sertifikat-piagam', 'offset-printing', 4000, 'lembar'),
    ('Stiker Chromo', 'stiker-chromo', 'print-sticker', 3900, 'lembar'),
    ('Stiker UV DTF - Stiker Timbul', 'stiker-uv-dtf-timbul', 'print-sticker', 31500, 'paket'),
    ('Stiker HVS', 'stiker-hvs', 'print-sticker', 3900, 'lembar'),
    ('Stiker Craft', 'stiker-craft', 'print-sticker', 4400, 'lembar'),
    ('Stiker Vinyl Glossy', 'stiker-vinyl-glossy', 'print-sticker', 11000, 'lembar'),
    ('Stiker Vinyl Doff', 'stiker-vinyl-doff', 'print-sticker', 11000, 'lembar'),
    ('Stiker Vinyl Transparan', 'stiker-vinyl-transparan', 'print-sticker', 11000, 'lembar'),
    ('Stiker Gold Glossy', 'stiker-gold-glossy', 'print-sticker', 12200, 'lembar'),
    ('Stiker Gold Matte', 'stiker-gold-matte', 'print-sticker', 12200, 'lembar'),
    ('Stiker Silver Glossy', 'stiker-silver-glossy', 'print-sticker', 12200, 'lembar'),
    ('Stiker Silver Matte', 'stiker-silver-matte', 'print-sticker', 12200, 'lembar'),
    ('Stiker Hologram', 'stiker-hologram', 'print-sticker', 15500, 'lembar'),
    ('Stiker Vinyl China', 'stiker-vinyl-china', 'print-sticker', 55500, 'meter'),
    ('Stiker Vinyl Ritrama', 'stiker-vinyl-ritrama', 'print-sticker', 82500, 'meter'),
    ('Stiker Vinyl Transparan (Meter)', 'stiker-vinyl-transparan-meter', 'print-sticker', 82500, 'meter'),
    ('Stiker Vinyl Blockout', 'stiker-vinyl-blockout', 'print-sticker', 110000, 'meter'),
    ('Stiker Vinyl Camel Super Glossy', 'stiker-vinyl-camel-super-glossy', 'print-sticker', 82500, 'meter'),
    ('Stiker Albatros', 'stiker-albatros', 'print-sticker', 82500, 'meter'),
    ('Stiker One Way', 'stiker-one-way', 'print-sticker', 94000, 'meter'),
    ('Stiker Sandblast', 'stiker-sandblast', 'print-sticker', 85000, 'meter'),
    ('Kalender Meja', 'kalender-meja', 'kalender', 16000, 'pcs'),
    ('Kalender Dinding 32 x 48 cm', 'kalender-dinding-32-x-48-cm', 'kalender', 6500, 'pcs'),
    ('Kalender Dinding 38 x 54 cm', 'kalender-dinding-38-x-54-cm', 'kalender', 7900, 'pcs'),
    ('Kalender Dinding 40 x 60 cm', 'kalender-dinding-40-x-60-cm', 'kalender', 10500, 'pcs'),
    ('MMT | Spanduk', 'mmt-spanduk', 'spanduk-banner', 20000, 'meter'),
    ('Satin', 'satin', 'spanduk-banner', 38500, 'meter'),
    ('Spanduk Kain / Textile', 'spanduk-kain-textile', 'spanduk-banner', 33000, 'meter'),
    ('Mini Banner', 'mini-banner', 'spanduk-banner', 28000, 'pcs'),
    ('Y Banner', 'y-banner', 'spanduk-banner', 55000, 'pcs'),
    ('Roll Up Banner 60x160', 'roll-up-banner-60x160', 'spanduk-banner', 188000, 'pcs'),
    ('Roll Up Banner 85x200', 'roll-up-banner-85x200', 'spanduk-banner', 243000, 'pcs'),
    ('Door Frame Banner 60x160', 'door-frame-banner-60x160', 'spanduk-banner', 275000, 'pcs'),
    ('Tripod Banner 2 Sisi', 'tripod-banner-2-sisi', 'spanduk-banner', 468000, 'pcs'),
    ('Tripod Banner 1 Sisi', 'tripod-banner-1-sisi', 'spanduk-banner', 193000, 'pcs'),
    ('Roll Banner Elektrik', 'roll-banner-elektrik', 'spanduk-banner', 1650000, 'pcs'),
    ('Event Desk', 'event-desk', 'spanduk-banner', 936000, 'pcs'),
    ('Print Canvas', 'print-canvas', 'large-format', 275000, 'meter'),
    ('Albatros (Cetak Format Besar)', 'albatros-format-besar', 'large-format', 61000, 'meter'),
    ('Luster (Cetak Format Besar)', 'luster-format-besar', 'large-format', 92400, 'meter'),
    ('Photo Paper (Cetak Format Besar)', 'photo-paper-format-besar', 'photography', 85800, 'meter'),
    ('Large Poster HVS', 'large-poster-hvs', 'large-format', 25000, 'lembar'),
    ('Large Poster Art Paper 150', 'large-poster-art-paper-150', 'large-format', 31000, 'lembar'),
    ('Large Poster Art Carton 230', 'large-poster-art-carton-230', 'large-format', 33000, 'lembar'),
    ('Large Poster Albatros', 'large-poster-albatros', 'large-format', 33000, 'lembar'),
    ('Large Poster Luster', 'large-poster-luster', 'large-format', 33000, 'lembar'),
    ('Large Poster Photo Paper', 'large-poster-photo-paper', 'photography', 33000, 'lembar'),
    ('Large Poster Canvas', 'large-poster-canvas', 'large-format', 110000, 'lembar'),
    ('Backlite', 'backlite', 'large-format', 77000, 'meter'),
    ('Duratrans', 'duratrans', 'large-format', 85000, 'meter'),
    ('Kop Surat', 'kop-surat', 'perlengkapan-bisnis', 250000, 'paket'),
    ('Map', 'map', 'perlengkapan-bisnis', 4500, 'pcs'),
    ('ID Card', 'id-card', 'perlengkapan-bisnis', 15000, 'pcs'),
    ('Amplop', 'amplop', 'perlengkapan-bisnis', 165000, 'paket'),
    ('Company Profile', 'company-profile', 'offset-printing', 10000, 'pcs'),
    ('Paper Bag', 'paper-bag', 'packaging', 4500, 'pcs'),
    ('Katalog', 'katalog', 'offset-printing', 10000, 'pcs'),
    ('Sticker Label - 3 x 3 cm', 'sticker-label-3-x-3-cm', 'print-sticker', 95, 'pcs'),
    ('Sticker Label - 3 x 4 cm', 'sticker-label-3-x-4-cm', 'print-sticker', 140, 'pcs'),
    ('Sticker Label - 3 x 6 cm', 'sticker-label-3-x-6-cm', 'print-sticker', 220, 'pcs'),
    ('Sticker Label - 3 x 7 cm', 'sticker-label-3-x-7-cm', 'print-sticker', 260, 'pcs')
)
insert into public.products (
  name, slug, category, category_id, description, base_price, unit, stock_quantity, is_active
)
select
  incoming.name,
  incoming.slug,
  category.name,
  category.id,
  'Harga referensi sementara dari daftar yang diberikan. Konfirmasi harga dan spesifikasi final kepada admin APRINTZ sebelum pemesanan.',
  incoming.base_price,
  incoming.unit,
  0,
  true
from incoming
join public.categories as category on category.slug = incoming.category_slug
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  category_id = excluded.category_id,
  description = excluded.description,
  base_price = excluded.base_price,
  unit = excluded.unit;

notify pgrst, 'reload schema';
