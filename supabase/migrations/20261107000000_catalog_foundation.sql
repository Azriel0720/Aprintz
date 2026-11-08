create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null,
  description text,
  base_price numeric(14,2) not null default 0,
  unit text not null default 'pcs',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  notes text,
  status text not null default 'Menunggu konfirmasi',
  total_estimate numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  specification text not null,
  quantity integer not null check (quantity > 0),
  unit_price_estimate numeric(14,2) not null default 0,
  note text
);

create table if not exists order_designs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  storage_path text not null,
  original_file_name text not null,
  content_type text not null,
  file_size integer not null check (file_size > 0),
  review_status text not null default 'Menunggu review desain',
  created_at timestamptz not null default now()
);

create index if not exists order_designs_order_created_idx on order_designs(order_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('order-designs', 'order-designs', false, 52428800, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

create index if not exists orders_order_number_idx on orders(order_number);
create index if not exists orders_created_at_idx on orders(created_at desc);

insert into products(name, slug, category, description, base_price, unit) values
  ('Brosur A5', 'brosur-a5', 'Digital Printing', 'Brosur full color', 850, 'lembar'),
  ('Kartu Nama', 'kartu-nama', 'Offset & Digital', 'Kartu nama custom', 35000, 'box'),
  ('Banner / Spanduk', 'banner-flexi', 'Large Format', 'Banner dan spanduk', 25000, 'm2'),
  ('Stiker Custom', 'stiker-custom', 'Digital Printing', 'Stiker custom', 12000, 'lembar'),
  ('Kaos Custom', 'kaos-custom', 'Konveksi', 'Produksi kaos custom', 65000, 'pcs'),
  ('Undangan', 'undangan', 'Offset & Digital', 'Undangan custom', 1800, 'pcs')
on conflict (slug) do nothing;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table products add column if not exists category_id uuid references categories(id) on delete set null;
alter table products add column if not exists stock_quantity integer not null default 0 check (stock_quantity >= 0);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  min_quantity integer not null default 1 check (min_quantity > 0),
  specifications jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, name)
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true, 52428800, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Admins can manage product images" on storage.objects;
create policy "Admins can manage product images" on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'product-images' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

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
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order;

update products as product
set category_id = category.id
from categories as category
where category.slug = case product.slug
  when 'brosur-a5' then 'print-on-paper'
  when 'kartu-nama' then 'perlengkapan-bisnis'
  when 'banner-flexi' then 'spanduk-banner'
  when 'stiker-custom' then 'print-sticker'
  when 'kaos-custom' then 'merchandise'
  when 'undangan' then 'offset-printing'
  else null
end
and product.category_id is null;

create index if not exists products_category_active_idx on products(category_id, is_active);
create index if not exists product_variants_product_active_idx on product_variants(product_id, is_active);
create index if not exists product_images_product_order_idx on product_images(product_id, display_order);

alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_designs enable row level security;

drop policy if exists "Public can read active categories" on categories;
create policy "Public can read active categories" on categories for select to anon, authenticated using (is_active);

drop policy if exists "Public can read active products" on products;
create policy "Public can read active products" on products for select to anon, authenticated using (is_active);

drop policy if exists "Public can read active product variants" on product_variants;
create policy "Public can read active product variants" on product_variants for select to anon, authenticated using (
  is_active and exists (select 1 from products where products.id = product_variants.product_id and products.is_active)
);

drop policy if exists "Public can read active product images" on product_images;
create policy "Public can read active product images" on product_images for select to anon, authenticated using (
  exists (select 1 from products where products.id = product_images.product_id and products.is_active)
);