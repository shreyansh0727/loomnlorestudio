-- Invoice numbers follow the invoice prefix saved in Studio → Settings.
-- Apply after 20261024000300_functions.sql.

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
    v_prefix := 'LL';
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
