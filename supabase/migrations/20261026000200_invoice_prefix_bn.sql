-- Invoice numbers follow the prefix saved in Studio → Settings.
-- Supersedes the LL fallback in 20261024000400_invoice_prefix.sql; run this file
-- once on databases that still issue LL/INV/... numbers.
--
-- A legacy stored prefix (LL from the original schema, LC from the seed defaults,
-- or empty) is moved to BN; any other prefix saved in Studio is left untouched.
-- Orders already numbered with that legacy prefix are renumbered to BN so guest
-- order pages, invoices and emails all show the current series.

update public.site_settings
   set data = jsonb_set(coalesce(data, '{}'::jsonb), '{invoicePrefix}', '"BN"'::jsonb),
       updated_at = now()
 where id = true
   and upper(coalesce(data->>'invoicePrefix', '')) in ('', 'LL', 'LC');

update public.orders o
   set invoice_number = 'BN' || substring(o.invoice_number from 3)
 where o.invoice_number ~* '^(ll|lc)/'
   and not exists (
     select 1
       from public.orders other
      where other.id <> o.id
        and other.invoice_number = 'BN' || substring(o.invoice_number from 3)
   );

create or replace function public.next_invoice_number()
returns text
language plpgsql
volatile
as $$
declare
  v_prefix text;
begin
  select data->>'invoicePrefix'
    into v_prefix
    from public.site_settings
   where id = true;

  v_prefix := upper(regexp_replace(coalesce(v_prefix, ''), '[^a-zA-Z0-9]', '', 'g'));

  if v_prefix = '' then
    v_prefix := 'BN';
  end if;

  v_prefix := left(v_prefix, 8);

  return v_prefix || '/INV/' ||
    to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '/' ||
    lpad(nextval('public.invoice_number_seq')::text, 5, '0');
end;
$$;

revoke all on function public.next_invoice_number() from public;
grant usage, select on sequence public.invoice_number_seq to service_role;
grant execute on function public.next_invoice_number() to service_role;
