-- Order numbers follow the prefix saved in Studio → Settings, the same way invoice
-- numbers do. Apply after 20261026000200_invoice_prefix_bn.sql.
--
-- Older databases still issue LL-… order numbers because next_order_number() was
-- defined with a hardcoded prefix. Legacy LL-/LC- order numbers are renumbered to BN
-- here; any other prefix is left untouched. Webhooks look orders up by
-- razorpay_order_id and emails carry the order id, so pending orders can be
-- renumbered safely.

update public.orders o
   set order_number = 'BN' || substring(o.order_number from 3)
 where o.order_number ~* '^(ll|lc)-'
   and not exists (
     select 1
       from public.orders other
      where other.id <> o.id
        and other.order_number = 'BN' || substring(o.order_number from 3)
   );

create or replace function public.next_order_number()
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

  return v_prefix || '-' ||
    to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 5, '0');
end;
$$;

revoke all on function public.next_order_number() from public;
grant usage, select on sequence public.order_number_seq to service_role;
grant execute on function public.next_order_number() to service_role;
