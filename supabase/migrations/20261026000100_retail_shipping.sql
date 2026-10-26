-- Retail orders now include a fixed zone-based shipping charge in the online
-- total. Finalization must accept that total and mark the shipping settled.
-- Wholesale shipping stays a separate manual payment link.

create or replace function public.finalize_paid_order(
  p_order_id uuid,
  p_payment_id text,
  p_razorpay_order_id text,
  p_amount integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_demand record;
  v_shortfall jsonb := '[]'::jsonb;
  v_available boolean := true;
  v_invoice_number text;
  v_retry boolean := false;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  -- A paid order normally needs no further work. The exception is
  -- payment_review: an admin replenished stock and retried fulfilment.
  if v_order.payment_status = 'paid' and v_order.status <> 'payment_review' then
    return jsonb_build_object(
      'status', v_order.status,
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'access_token', v_order.access_token,
      'already_finalized', true
    );
  end if;

  if v_order.status = 'payment_review' then
    v_retry := true;
  elsif v_order.status <> 'pending_payment' then
    raise exception 'ORDER_NOT_PAYABLE';
  end if;

  if p_amount is distinct from v_order.total_amount then
    raise exception 'PAYMENT_AMOUNT_MISMATCH';
  end if;

  if v_order.razorpay_order_id is not null
     and p_razorpay_order_id is distinct from v_order.razorpay_order_id then
    raise exception 'RAZORPAY_ORDER_MISMATCH';
  end if;

  -- Lock every existing variant referenced by the order, in a stable order to
  -- avoid deadlocks. PostgreSQL rejects FOR UPDATE on the nullable side of the
  -- left join used below, so the rows are locked separately first.
  perform pv.id
  from public.product_variants pv
  where pv.id in (
    select oi.variant_id
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.item_type = 'product'
      and oi.variant_id is not null

    union

    select (component.value->>'variant_id')::uuid
    from public.order_items oi
    cross join lateral jsonb_array_elements(
      coalesce(oi.metadata->'components', '[]'::jsonb)
    ) as component(value)
    where oi.order_id = p_order_id
      and oi.item_type = 'combo'
  )
  order by pv.id
  for update;

  -- Aggregate demand per variant, including components inside combos.
  for v_demand in
    with demand as (
      select variant_id, sum(qty)::int as qty
      from (
        select oi.variant_id, oi.quantity as qty
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.item_type = 'product'

        union all

        select
          (component.value->>'variant_id')::uuid as variant_id,
          ((component.value->>'quantity')::int * oi.quantity) as qty
        from public.order_items oi
        cross join lateral jsonb_array_elements(
          coalesce(oi.metadata->'components', '[]'::jsonb)
        ) as component(value)
        where oi.order_id = p_order_id
          and oi.item_type = 'combo'
      ) raw
      group by variant_id
    )
    select
      d.variant_id,
      d.qty,
      pv.stock_qty,
      pv.label as variant_label,
      pv.sku
    from demand d
    left join public.product_variants pv on pv.id = d.variant_id
    order by d.variant_id
  loop
    if v_demand.stock_qty is null or v_demand.stock_qty < v_demand.qty then
      v_available := false;
      v_shortfall := v_shortfall || jsonb_build_array(
        jsonb_build_object(
          'variant_id', v_demand.variant_id,
          'variant_label', coalesce(v_demand.variant_label, 'Missing variant'),
          'requested', v_demand.qty,
          'available', coalesce(v_demand.stock_qty, 0)
        )
      );
    end if;
  end loop;

  -- Payment was captured but stock changed between checkout and webhook.
  -- Keep the money recorded, park the order for manual resolution, and let an
  -- admin refund or replenish stock without silently overselling.
  if not v_available then
    update public.orders
    set
      status = 'payment_review',
      payment_status = 'paid',
      shipping_payment_status = case
        when coalesce(shipping_amount, 0) > 0 then 'paid'
        else shipping_payment_status
      end,
      razorpay_order_id = coalesce(razorpay_order_id, p_razorpay_order_id),
      razorpay_payment_id = p_payment_id,
      amount_paid = p_amount,
      paid_at = coalesce(paid_at, now()),
      internal_notes = case
        when v_retry then internal_notes
        else concat_ws(
          E'\n',
          internal_notes,
          'Payment captured with insufficient stock. Review and refund or fulfil manually. Shortfall: ' || v_shortfall::text
        )
      end
    where id = p_order_id;

    insert into public.order_events (order_id, event_type, status, message)
    values (
      p_order_id,
      'payment_review',
      'payment_review',
      case
        when v_retry then 'Manual fulfilment retry: stock is still insufficient. Shortfall: ' || v_shortfall::text
        else 'Payment received but stock was insufficient. Manual review required.'
      end
    );

    return jsonb_build_object(
      'status', 'payment_review',
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'access_token', v_order.access_token,
      'shortfall', v_shortfall
    );
  end if;

  for v_demand in
    with demand as (
      select variant_id, sum(qty)::int as qty
      from (
        select oi.variant_id, oi.quantity as qty
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.item_type = 'product'

        union all

        select
          (component.value->>'variant_id')::uuid as variant_id,
          ((component.value->>'quantity')::int * oi.quantity) as qty
        from public.order_items oi
        cross join lateral jsonb_array_elements(
          coalesce(oi.metadata->'components', '[]'::jsonb)
        ) as component(value)
        where oi.order_id = p_order_id
          and oi.item_type = 'combo'
      ) raw
      group by variant_id
    )
    select d.variant_id, d.qty
    from demand d
    order by d.variant_id
  loop
    update public.product_variants
    set stock_qty = stock_qty - v_demand.qty
    where id = v_demand.variant_id;

    insert into public.inventory_movements (
      variant_id,
      order_id,
      change_qty,
      reason,
      note
    )
    values (
      v_demand.variant_id,
      p_order_id,
      -v_demand.qty,
      'order_paid',
      'Stock decremented after successful Razorpay payment.'
    );
  end loop;

  v_invoice_number := coalesce(v_order.invoice_number, public.next_invoice_number());

  if v_order.coupon_id is not null then
    insert into public.coupon_redemptions (
      coupon_id,
      order_id,
      user_id,
      email,
      discount_amount
    )
    values (
      v_order.coupon_id,
      p_order_id,
      v_order.user_id,
      v_order.email,
      v_order.discount_amount
    )
    on conflict (order_id) do nothing;
  end if;

  update public.orders
  set
    status = 'confirmed',
    payment_status = 'paid',
    shipping_payment_status = case
      when coalesce(shipping_amount, 0) > 0 then 'paid'
      else shipping_payment_status
    end,
    razorpay_order_id = coalesce(razorpay_order_id, p_razorpay_order_id),
    razorpay_payment_id = p_payment_id,
    amount_paid = p_amount,
    invoice_number = v_invoice_number,
    paid_at = coalesce(paid_at, now()),
    stock_reserved_at = now()
  where id = p_order_id;

  insert into public.order_events (order_id, event_type, status, message)
  values (
    p_order_id,
    'payment_received',
    'confirmed',
    case
      when v_retry then 'Manual review resolved. Stock reserved and invoice number assigned.'
      else 'Payment received. Stock reserved and invoice number assigned.'
    end
  );

  return jsonb_build_object(
    'status', 'confirmed',
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'access_token', v_order.access_token,
    'invoice_number', v_invoice_number,
    'already_finalized', false
  );
end;
$$;
