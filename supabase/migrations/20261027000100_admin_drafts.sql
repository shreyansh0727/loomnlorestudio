-- Unfinished studio work. Only the service role touches this table, so no
-- policies or grants are added here.
create table if not exists public.admin_drafts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('product', 'coupon', 'combo', 'section', 'popup')),
  label text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_drafts_updated_idx
  on public.admin_drafts (updated_at desc);

alter table public.admin_drafts enable row level security;

drop trigger if exists set_admin_drafts_updated_at on public.admin_drafts;
create trigger set_admin_drafts_updated_at
  before update on public.admin_drafts
  for each row execute function public.set_updated_at();
