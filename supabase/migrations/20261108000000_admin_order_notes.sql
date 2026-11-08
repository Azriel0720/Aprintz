alter table public.orders
	add column if not exists admin_notes text not null default '';