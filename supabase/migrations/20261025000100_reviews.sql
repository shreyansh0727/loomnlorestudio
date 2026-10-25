-- Verified-purchase product reviews with customer photos.
-- Run after 20261024000400_invoice_prefix.sql.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  reviewer_name text not null,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null,
  images text[] not null default '{}',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, product_id),
  constraint product_reviews_images_check check (cardinality(images) <= 4)
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, created_at desc);

create index if not exists product_reviews_order_idx
  on public.product_reviews (order_id);

drop trigger if exists set_product_reviews_updated_at on public.product_reviews;
create trigger set_product_reviews_updated_at before update on public.product_reviews
  for each row execute function public.set_updated_at();

alter table public.product_reviews enable row level security;

drop policy if exists "product_reviews_public_read" on public.product_reviews;
create policy "product_reviews_public_read"
  on public.product_reviews for select
  to anon, authenticated
  using (is_published = true or public.is_admin());

grant select on public.product_reviews to anon, authenticated;
grant select, insert, update, delete on public.product_reviews to service_role;

-- Let the homepage render a customer-review section.
alter table public.homepage_sections
  drop constraint if exists homepage_sections_section_type_check;

alter table public.homepage_sections
  add constraint homepage_sections_section_type_check check (
    section_type in (
      'hero',
      'offer_ticker',
      'category_grid',
      'product_rail',
      'banner',
      'editorial',
      'combo_rail',
      'reviews'
    )
  );

insert into public.homepage_sections (
  id, section_type, title, subtitle, config, sort_order, is_active
)
select
  'f0000000-0000-4000-8000-000000000009',
  'reviews',
  'Loved in real life',
  'Notes and photos from customers who brought a little Buniya home.',
  '{"limit": 6}'::jsonb,
  coalesce((select max(sort_order) from public.homepage_sections), 0) + 1,
  true
where not exists (
  select 1 from public.homepage_sections where section_type = 'reviews'
);
