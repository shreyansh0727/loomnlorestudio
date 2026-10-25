-- Loom & Lore — core schema
-- Run this in the Supabase SQL editor, then run 20261024000200_rls.sql,
-- 20261024000300_functions.sql, and finally `npm run seed`.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create sequence if not exists public.order_number_seq start with 1042;
create sequence if not exists public.invoice_number_seq start with 1001;

create or replace function public.next_order_number()
returns text
language sql
volatile
as $$
  select 'BN-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

create or replace function public.next_invoice_number()
returns text
language sql
volatile
as $$
  select 'LL/INV/' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '/' || lpad(nextval('public.invoice_number_seq')::text, 5, '0');
$$;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  account_type text not null default 'b2c' check (account_type in ('b2c', 'b2b')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    case
      when new.raw_app_meta_data->>'role' = 'admin' then 'admin'
      else 'customer'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
        phone = coalesce(excluded.phone, public.profiles.phone);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for auth users that predate this migration.
insert into public.profiles (id, email, full_name, phone, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  nullif(u.raw_user_meta_data->>'phone', ''),
  case when u.raw_app_meta_data->>'role' = 'admin' then 'admin' else 'customer' end
from auth.users u
on conflict (id) do nothing;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  legal_name text not null,
  trade_name text,
  gstin text not null,
  email text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_status_idx on public.businesses (status, submitted_at desc);
create index if not exists businesses_gstin_idx on public.businesses (upper(gstin));

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  category_id uuid not null references public.categories(id) on delete restrict,
  retail_price integer not null check (retail_price > 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price > 0),
  wholesale_price integer check (wholesale_price is null or wholesale_price > 0),
  moq integer not null default 1 check (moq > 0),
  unit text not null default 'piece',
  images text[] not null default '{}',
  tags text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_best_seller boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id, is_active);
create index if not exists products_created_idx on public.products (created_at desc);
create index if not exists products_featured_idx on public.products (is_featured) where is_active;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  sku text unique,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  retail_price_override integer check (retail_price_override is null or retail_price_override > 0),
  wholesale_price_override integer check (wholesale_price_override is null or wholesale_price_override > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_idx on public.product_variants (product_id, sort_order);
create index if not exists product_variants_stock_idx on public.product_variants (stock_qty);

create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  image_url text,
  bundle_price integer not null check (bundle_price > 0),
  audience text not null default 'all' check (audience in ('b2c', 'b2b', 'all')),
  is_active boolean not null default true,
  show_in_offers boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.combos(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (combo_id, variant_id)
);

-- ---------------------------------------------------------------------------
-- Promotions
-- ---------------------------------------------------------------------------

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  max_discount_amount integer check (max_discount_amount is null or max_discount_amount > 0),
  min_order_amount integer not null default 0 check (min_order_amount >= 0),
  audience text not null default 'all' check (audience in ('b2c', 'b2b', 'all')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_customer_limit integer check (per_customer_limit is null or per_customer_limit > 0),
  first_order_only boolean not null default false,
  is_public boolean not null default true,
  show_in_offers boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_percentage_range check (
    discount_type <> 'percentage' or discount_value between 1 and 100
  )
);

create unique index if not exists coupons_code_lower_idx on public.coupons (lower(code));

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid not null unique,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  discount_amount integer not null default 0 check (discount_amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id);
create index if not exists coupon_redemptions_email_idx on public.coupon_redemptions (lower(email));

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.next_order_number(),
  access_token uuid not null unique default gen_random_uuid(),
  invoice_number text unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  buyer_type text not null default 'b2c' check (buyer_type in ('b2c', 'b2b')),
  business_id uuid references public.businesses(id) on delete set null,
  business_legal_name text,
  business_gstin text,
  status text not null default 'pending_payment' check (
    status in (
      'pending_payment',
      'payment_review',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'refund_requested',
      'refunded'
    )
  ),
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')
  ),
  shipping_payment_status text not null default 'not_required' check (
    shipping_payment_status in ('not_required', 'pending', 'paid')
  ),
  subtotal integer not null check (subtotal >= 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  shipping_amount integer not null default 0 check (shipping_amount >= 0),
  product_total integer not null check (product_total >= 0),
  tax_rate numeric(5, 2) not null default 5 check (tax_rate >= 0),
  tax_amount integer not null default 0 check (tax_amount >= 0),
  total_amount integer not null check (total_amount >= 0),
  amount_paid integer not null default 0 check (amount_paid >= 0),
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  coupon_label text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_shipping_payment_id text,
  shipping_payment_link_id text,
  shipping_payment_link_url text,
  shipping_carrier text,
  tracking_number text,
  tracking_url text,
  shipping_address jsonb not null,
  billing_address jsonb not null,
  customer_note text,
  internal_notes text,
  stock_reserved_at timestamptz,
  stock_restored_at timestamptz,
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz,
  refund_amount integer not null default 0 check (refund_amount >= 0),
  refund_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_check check (total_amount = subtotal - discount_amount + shipping_amount)
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_email_idx on public.orders (lower(email), created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_razorpay_order_idx on public.orders (razorpay_order_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  combo_id uuid references public.combos(id) on delete restrict,
  item_type text not null check (item_type in ('product', 'combo')),
  name text not null,
  variant_label text,
  sku text,
  image_url text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint order_items_reference_check check (
    (item_type = 'product' and product_id is not null and variant_id is not null and combo_id is null)
    or
    (item_type = 'combo' and combo_id is not null and product_id is null and variant_id is null)
  )
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'order_created',
      'payment_received',
      'payment_review',
      'status_change',
      'note',
      'shipping_payment_requested',
      'shipping_payment_received',
      'refund_recorded',
      'stock_restored'
    )
  ),
  status text,
  message text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Storefront content & settings
-- ---------------------------------------------------------------------------

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_type text not null check (
    section_type in (
      'hero',
      'offer_ticker',
      'category_grid',
      'product_rail',
      'banner',
      'editorial',
      'combo_rail'
    )
  ),
  title text,
  subtitle text,
  config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_sections_order_idx
  on public.homepage_sections (sort_order, created_at);

create table if not exists public.popup_offers (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  body text not null default '',
  image_url text,
  coupon_code text,
  cta_label text,
  cta_href text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  delay_seconds integer not null default 5 check (delay_seconds between 0 and 120),
  frequency text not null default 'once_per_day' check (
    frequency in ('once_per_visit', 'once_per_day', 'always')
  ),
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id boolean primary key default true check (id = true),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, data)
values (true, '{}'::jsonb)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Inventory & notification logs
-- ---------------------------------------------------------------------------

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  change_qty integer not null check (change_qty <> 0),
  reason text not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_variant_idx
  on public.inventory_movements (variant_id, created_at desc);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  recipient text not null,
  template text not null,
  subject text not null,
  status text not null check (status in ('sent', 'skipped', 'failed')),
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists email_logs_order_idx on public.email_logs (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

drop trigger if exists set_combos_updated_at on public.combos;
create trigger set_combos_updated_at before update on public.combos
  for each row execute function public.set_updated_at();

drop trigger if exists set_coupons_updated_at on public.coupons;
create trigger set_coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

drop trigger if exists set_homepage_sections_updated_at on public.homepage_sections;
create trigger set_homepage_sections_updated_at before update on public.homepage_sections
  for each row execute function public.set_updated_at();

drop trigger if exists set_popup_offers_updated_at on public.popup_offers;
create trigger set_popup_offers_updated_at before update on public.popup_offers
  for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Media bucket for admin uploads
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  15728640,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
