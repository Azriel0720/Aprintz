insert into products(name, slug, category, description, base_price, unit) values
  ('Brosur A5', 'brosur-a5', 'Digital Printing', 'Brosur full color', 850, 'lembar'),
  ('Kartu Nama', 'kartu-nama', 'Offset & Digital', 'Kartu nama custom', 35000, 'box'),
  ('Banner / Spanduk', 'banner-flexi', 'Large Format', 'Banner dan spanduk', 25000, 'm2'),
  ('Stiker Custom', 'stiker-custom', 'Digital Printing', 'Stiker custom', 12000, 'lembar'),
  ('Kaos Custom', 'kaos-custom', 'Konveksi', 'Produksi kaos custom', 65000, 'pcs'),
  ('Undangan', 'undangan', 'Offset & Digital', 'Undangan custom', 1800, 'pcs')
on conflict (slug) do nothing;

insert into categories (slug, name, description, display_order) values
  ('print-on-paper', 'Print on Paper', 'Brosur, kartu nama, undangan, dan kebutuhan cetak di kertas.', 1),
  ('print-sticker', 'Print Sticker', 'Stiker untuk label, branding, dekorasi, dan kebutuhan promosi.', 2),
  ('kalender', 'Kalender', 'Kalender meja dan dinding untuk kebutuhan rumah maupun bisnis.', 3),
  ('spanduk-banner', 'Spanduk & Banner', 'Spanduk, banner, dan materi promosi untuk indoor maupun outdoor.', 4),
  ('large-format', 'Large Format', 'Cetak format besar untuk display, dekorasi, dan kebutuhan event.', 5),
  ('perlengkapan-bisnis', 'Perlengkapan Bisnis', 'Kop surat, amplop, map, nota, dan identitas bisnis.', 6),
  ('photography', 'Photography', 'Cetak foto dan kebutuhan display fotografi.', 7),
  ('merchandise', 'Merchandise', 'Kaos dan produk merchandise custom untuk komunitas dan brand.', 8),
  ('offset-printing', 'Offset Printing', 'Produksi cetak offset untuk kebutuhan jumlah menengah dan besar.', 9),
  ('packaging', 'Packaging', 'Kemasan cetak untuk produk dan kebutuhan retail.', 10)
on conflict (slug) do nothing;