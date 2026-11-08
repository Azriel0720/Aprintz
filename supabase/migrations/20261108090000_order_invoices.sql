alter table public.orders
	add column if not exists final_total numeric(14, 2),
	add column if not exists invoice_status text not null default 'not_sent',
	add column if not exists invoice_sent_at timestamptz;
