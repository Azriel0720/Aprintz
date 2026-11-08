create table if not exists public.homepage_banners (
	id uuid primary key default gen_random_uuid(),
	eyebrow text not null default '',
	title text not null,
	description text not null default '',
	cta_label text not null default 'Lihat produk',
	href text not null default '/produk',
	image_url text not null,
	image_path text not null,
	display_order integer not null default 0,
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.homepage_reviews (
	id uuid primary key default gen_random_uuid(),
	customer_name text not null,
	company text not null default '',
	content text not null,
	rating integer not null default 5 check (rating between 1 and 5),
	image_url text,
	image_path text,
	display_order integer not null default 0,
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists homepage_banners_active_order_idx on public.homepage_banners(is_active, display_order);
create index if not exists homepage_reviews_active_order_idx on public.homepage_reviews(is_active, display_order);

alter table public.homepage_banners enable row level security;
alter table public.homepage_reviews enable row level security;

drop policy if exists "Public can read active homepage banners" on public.homepage_banners;
create policy "Public can read active homepage banners" on public.homepage_banners
	for select to anon, authenticated using (is_active);

drop policy if exists "Admins can manage homepage banners" on public.homepage_banners;
create policy "Admins can manage homepage banners" on public.homepage_banners
	for all to authenticated
	using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
	with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read active homepage reviews" on public.homepage_reviews;
create policy "Public can read active homepage reviews" on public.homepage_reviews
	for select to anon, authenticated using (is_active);

drop policy if exists "Admins can manage homepage reviews" on public.homepage_reviews;
create policy "Admins can manage homepage reviews" on public.homepage_reviews
	for all to authenticated
	using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
	with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');