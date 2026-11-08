begin;

alter table public.products
  add column if not exists show_on_home boolean not null default false,
  add column if not exists is_best_seller boolean not null default false;

update public.products
set show_on_home = true
where slug in (
  'print-a3-plus-color',
  'print-copy-a4-a3',
  'brosur-a5',
  'kartu-nama-standart',
  'stiker-uv-dtf-timbul',
  'kalender-meja',
  'mmt-spanduk',
  'spanduk-kain-textile',
  'print-pas-foto',
  'mug',
  'paper-bag',
  'lunchbox-cetak'
);

notify pgrst, 'reload schema';
commit;
