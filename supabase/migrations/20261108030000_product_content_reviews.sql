alter table public.products
  add column if not exists specifications text not null default '',
  add column if not exists important_note text not null default '';

alter table public.order_items
  add column if not exists design_url text;

update storage.buckets
set allowed_mime_types = array[
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml',
  'application/postscript', 'application/illustrator', 'application/vnd.corel-draw',
  'application/x-cdr', 'image/vnd.adobe.photoshop', 'application/vnd.adobe.photoshop',
  'application/zip', 'application/x-zip-compressed', 'application/vnd.rar',
  'application/x-rar-compressed', 'application/octet-stream'
]
where id = 'order-designs';

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  content text not null,
  created_at timestamptz not null default now(),
  unique (product_id, order_id)
);

create index if not exists product_reviews_product_created_idx
  on public.product_reviews(product_id, created_at desc);

alter table public.product_reviews enable row level security;
drop policy if exists "Public can read product reviews" on public.product_reviews;
notify pgrst, 'reload schema';
