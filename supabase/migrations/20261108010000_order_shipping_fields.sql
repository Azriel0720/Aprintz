alter table public.orders
	add column if not exists shipping_courier text,
	add column if not exists tracking_number text,
	add column if not exists shipped_at timestamptz;