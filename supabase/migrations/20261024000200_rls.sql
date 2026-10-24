-- Row-level security
-- All storefront content is readable by anonymous visitors. Customer-owned
-- records are protected, and every write goes through server actions using the
-- service role after an explicit admin/customer authorization check.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.combos enable row level security;
alter table public.combo_items enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.popup_offers enable row level security;
alter table public.site_settings enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.email_logs enable row level security;

-- Profiles -----------------------------------------------------------------

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- Businesses ---------------------------------------------------------------

drop policy if exists "businesses_select_own_or_admin" on public.businesses;
create policy "businesses_select_own_or_admin"
  on public.businesses for select
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- Catalog ------------------------------------------------------------------

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "product_variants_public_read" on public.product_variants;
create policy "product_variants_public_read"
  on public.product_variants for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.products p
      where p.id = product_variants.product_id
        and p.is_active = true
    )
  );

drop policy if exists "combos_public_read" on public.combos;
create policy "combos_public_read"
  on public.combos for select
  to anon, authenticated
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "combo_items_public_read" on public.combo_items;
create policy "combo_items_public_read"
  on public.combo_items for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.combos c
      where c.id = combo_items.combo_id
        and c.is_active = true
        and (c.starts_at is null or c.starts_at <= now())
        and (c.ends_at is null or c.ends_at >= now())
    )
  );

-- Public coupon codes are intentionally visible when marked public. Private
-- codes are still redeemable through server-side validation.
drop policy if exists "coupons_public_read" on public.coupons;
create policy "coupons_public_read"
  on public.coupons for select
  to anon, authenticated
  using (
    is_active = true
    and is_public = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

-- Orders -------------------------------------------------------------------

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "order_events_select_own_or_admin" on public.order_events;
create policy "order_events_select_own_or_admin"
  on public.order_events for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_events.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- Storefront editorial content --------------------------------------------

drop policy if exists "homepage_sections_public_read" on public.homepage_sections;
create policy "homepage_sections_public_read"
  on public.homepage_sections for select
  to anon, authenticated
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "popup_offers_public_read" on public.popup_offers;
create policy "popup_offers_public_read"
  on public.popup_offers for select
  to anon, authenticated
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
  on public.site_settings for select
  to anon, authenticated
  using (true);

-- Explicitly expose only public-readable tables to anonymous visitors.
-- Admin data is accessed through the service role after server-side checks.
grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_variants to anon, authenticated;
grant select on public.combos to anon, authenticated;
grant select on public.combo_items to anon, authenticated;
grant select on public.coupons to anon, authenticated;
grant select on public.homepage_sections to anon, authenticated;
grant select on public.popup_offers to anon, authenticated;
grant select on public.site_settings to anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.businesses to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.order_events to authenticated;
