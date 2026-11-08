begin;

alter table public.order_items
  add column if not exists design_url text;

notify pgrst, 'reload schema';
commit;
