drop function if exists public.track_orders_by_phone(text, text);

create or replace function public.track_orders_by_phone(store_slug text, phone text)
returns table (
  order_id uuid,
  order_number text,
  customer_name text,
  phone text,
  email text,
  city text,
  address text,
  status text,
  created_at timestamptz,
  total_amount numeric,
  currency text,
  product_id uuid,
  product_name text,
  product_image text,
  quantity integer,
  selected_options jsonb,
  custom_fields jsonb,
  timeline jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.order_number,
    o.customer_name,
    o.phone,
    o.email,
    o.city,
    o.address,
    o.status,
    o.created_at,
    o.total_amount,
    o.currency,
    oi.product_id,
    coalesce(oi.product_name, 'Order') as product_name,
    oi.product_image_url as product_image,
    coalesce(oi.quantity, 1) as quantity,
    coalesce(oi.selected_options, '{}'::jsonb) as selected_options,
    coalesce(
      (
        select jsonb_object_agg(ocfv.field_label, ocfv.value)
        from public.order_custom_field_values ocfv
        where ocfv.order_id = o.id
      ),
      '{}'::jsonb
    ) as custom_fields,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object('status', ot.status, 'note', ot.note, 'created_at', ot.created_at) order by ot.created_at asc)
        from public.order_timeline ot
        where ot.order_id = o.id
      ),
      '[]'::jsonb
    ) as timeline
  from public.orders o
  join public.stores s on s.id = o.store_id
  left join lateral (
    select product_id, product_name, product_image_url, quantity, selected_options
    from public.order_items
    where order_id = o.id
    order by created_at asc
    limit 1
  ) oi on true
  where s.slug = track_orders_by_phone.store_slug
    and regexp_replace(o.phone, '\D', '', 'g') = regexp_replace(track_orders_by_phone.phone, '\D', '', 'g')
  order by o.created_at desc;
$$;

revoke all on function public.track_orders_by_phone(text, text) from public;
grant execute on function public.track_orders_by_phone(text, text) to anon, authenticated;
