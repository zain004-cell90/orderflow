-- OrderFlow Phase 3 Supabase schema, RLS, storage, RPCs.
-- Apply to project rucsowndqbckpepwinnp after reviewing in a development database.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'owner' check (role in ('admin','owner')),
  account_status text not null default 'active' check (account_status in ('active','suspended','blocked','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  logo_url text,
  country text,
  currency text not null default 'USD',
  timezone text,
  business_phone text,
  business_email text,
  category text,
  is_setup_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_one_per_owner unique (owner_id)
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  phone_required boolean not null default true,
  address_required boolean not null default true,
  city_required boolean not null default true,
  order_tracking_enabled boolean not null default true,
  allow_multiple_products boolean not null default false,
  cod_enabled boolean not null default true,
  thank_you_message text,
  default_order_status text not null default 'received' check (default_order_status in ('received','confirmed','packed','shipped','delivered','cancelled')),
  date_format text not null default 'DD/MM/YYYY',
  phone_format text,
  button_color text not null default '#4F46E5',
  accent_color text not null default '#60A5FA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  description text,
  category text,
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  status text not null default 'active' check (status in ('active','draft','archived')),
  stock integer not null default 0 check (stock >= 0),
  orders_count integer not null default 0 check (orders_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  type text not null default 'dropdown' check (type in ('text','number','dropdown','checkbox','textarea','date')),
  required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.product_options(id) on delete cascade,
  value text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.product_custom_fields (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  type text not null default 'text' check (type in ('text','number','dropdown','checkbox','textarea','date')),
  required boolean not null default false,
  enabled boolean not null default true,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_pages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  slug text unique not null,
  title text,
  is_active boolean not null default true,
  selected_product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_fields (
  id uuid primary key default gen_random_uuid(),
  checkout_page_id uuid not null references public.checkout_pages(id) on delete cascade,
  label text not null,
  type text not null check (type in ('text','number','dropdown','checkbox','textarea','date')),
  required boolean not null default false,
  enabled boolean not null default true,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  email text,
  phone text not null,
  phone_normalized text generated always as (regexp_replace(phone, '\D', '', 'g')) stored,
  country text,
  city text,
  address text,
  notes text,
  orders_count integer not null default 0,
  total_spent numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_store_phone_unique unique (store_id, phone),
  constraint customers_store_phone_normalized_unique unique (store_id, phone_normalized)
);

create table if not exists public.customer_custom_fields (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  label text not null,
  type text not null check (type in ('text','number','dropdown','checkbox','textarea','date')),
  required boolean not null default false,
  enabled boolean not null default true,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_custom_field_values (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  field_id uuid not null references public.customer_custom_fields(id) on delete cascade,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_field_value_unique unique (customer_id, field_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  order_number text not null,
  customer_name text not null,
  phone text not null,
  email text,
  city text,
  address text,
  status text not null default 'received' check (status in ('received','confirmed','packed','shipped','delivered','cancelled')),
  payment_method text not null default 'cod' check (payment_method in ('cod','COD','Cash on Delivery')),
  subtotal numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  currency text not null,
  notes text,
  source text not null default 'checkout',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_store_number_unique unique (store_id, order_number)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image_url text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  selected_options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.order_custom_field_values (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  field_label text not null,
  field_type text not null,
  value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.order_timeline (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null check (status in ('received','confirmed','packed','shipped','delivered','cancelled')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  message text,
  type text not null check (type in ('new_order','order_status_updated','product_created','product_updated','product_deleted','customer_created','customer_updated','settings_updated','checkout_page_updated','checkout_link_copied','export_completed','plan_limit_reached')),
  is_read boolean not null default false,
  action_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','starter','growth')),
  status text not null default 'active' check (status in ('active','past_due','cancelled')),
  orders_limit integer not null default 25,
  current_period_start timestamptz not null default date_trunc('month', now()),
  current_period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers
  add column if not exists phone_normalized text generated always as (regexp_replace(phone, '\D', '', 'g')) stored;

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check check (payment_method in ('cod','COD','Cash on Delivery'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customers_store_phone_normalized_unique'
      and conrelid = 'public.customers'::regclass
  ) then
    alter table public.customers
      add constraint customers_store_phone_normalized_unique unique (store_id, phone_normalized);
  end if;
end $$;

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists stores_owner_id_idx on public.stores (owner_id);
create index if not exists stores_slug_idx on public.stores (slug);
create index if not exists products_store_id_idx on public.products (store_id);
create index if not exists products_status_idx on public.products (status);
create index if not exists product_options_product_id_idx on public.product_options (product_id);
create index if not exists product_option_values_option_id_idx on public.product_option_values (option_id);
create index if not exists product_custom_fields_product_id_idx on public.product_custom_fields (product_id);
create index if not exists checkout_fields_page_id_idx on public.checkout_fields (checkout_page_id);
create index if not exists customers_store_id_idx on public.customers (store_id);
create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists customers_phone_normalized_idx on public.customers (phone_normalized);
create index if not exists orders_store_id_idx on public.orders (store_id);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_order_number_idx on public.orders (order_number);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_timeline_order_id_idx on public.order_timeline (order_id);
create index if not exists notifications_store_id_idx on public.notifications (store_id);
create index if not exists notifications_is_read_idx on public.notifications (is_read);
create index if not exists activity_logs_store_id_idx on public.activity_logs (store_id);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','stores','store_settings','products','product_options','product_option_values','product_custom_fields',
    'checkout_pages','checkout_fields','customers','customer_custom_fields','customer_custom_field_values',
    'orders','order_items','order_custom_field_values','order_timeline','notifications','activity_logs','subscriptions'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select on public.stores, public.store_settings, public.products, public.product_options, public.product_option_values, public.product_custom_fields, public.checkout_pages, public.checkout_fields to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and account_status = 'active'
  );
$$;

create or replace function public.owns_store(store_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores
    where id = store_uuid
      and owner_id = (select auth.uid())
  );
$$;

create or replace function public.current_user_store_id()
returns uuid
language sql
stable
security invoker
as $$
  select id from public.stores where owner_id = (select auth.uid()) limit 1;
$$;

create or replace function public.current_month_order_count(store_uuid uuid)
returns integer
language sql
stable
security invoker
as $$
  select count(*)::integer
  from public.orders
  where store_id = store_uuid
    and created_at >= date_trunc('month', now())
    and created_at < date_trunc('month', now()) + interval '1 month';
$$;

create or replace function public.orderflow_plan_limit(plan_name text)
returns integer
language sql
immutable
as $$
  select case lower(coalesce(plan_name, 'free'))
    when 'growth' then 500
    when 'starter' then 150
    else 25
  end;
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    case when lower(coalesce(new.email, '')) = 'zainali00490@gmail.com' then 'admin' else 'owner' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_orderflow_profile on auth.users;
create trigger on_auth_user_created_orderflow_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','stores','store_settings','products','product_custom_fields','checkout_pages','checkout_fields',
    'customers','customer_custom_fields','customer_custom_field_values','orders','notifications','subscriptions'
  ]
  loop
    execute format('drop trigger if exists %I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function public.orderflow_order_number(store_uuid uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare next_num integer;
begin
  select coalesce(max(nullif(regexp_replace(order_number, '\D', '', 'g'), '')::integer), 1000) + 1
  into next_num
  from public.orders
  where store_id = store_uuid;
  return 'ORD-' || next_num::text;
end;
$$;

create or replace function public.create_checkout_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_store public.stores%rowtype;
  target_page public.checkout_pages%rowtype;
  target_settings public.store_settings%rowtype;
  target_subscription public.subscriptions%rowtype;
  item jsonb;
  product_row public.products%rowtype;
  customer_uuid uuid;
  order_uuid uuid;
  order_no text;
  subtotal_amount numeric(12,2) := 0;
  quantity_value integer;
  phone_value text := trim(coalesce(payload->>'phone', payload#>>'{customer,phone}', ''));
  name_value text := trim(coalesce(payload->>'customer_name', payload->>'name', payload#>>'{customer,name}', ''));
  email_value text := nullif(trim(coalesce(payload->>'email', payload#>>'{customer,email}', '')), '');
  city_value text := nullif(trim(coalesce(payload->>'city', payload#>>'{customer,city}', '')), '');
  address_value text := nullif(trim(coalesce(payload->>'address', payload#>>'{customer,address}', '')), '');
  selected_store text := coalesce(payload->>'store_slug', payload->>'store_id');
  order_items_payload jsonb := coalesce(payload->'items', '[]'::jsonb);
  custom_fields_payload jsonb := coalesce(payload->'checkout_custom_fields', payload->'custom_fields', '{}'::jsonb);
  field_key text;
  field_value jsonb;
begin
  if name_value = '' or phone_value = '' then
    raise exception 'Customer name and phone are required.' using errcode = '22023';
  end if;

  select * into target_store
  from public.stores
  where slug = selected_store or id::text = selected_store
  limit 1;
  if target_store.id is null then
    raise exception 'Invalid checkout link.' using errcode = '22023';
  end if;

  select * into target_page
  from public.checkout_pages
  where store_id = target_store.id and is_active = true
  limit 1;
  if target_page.id is null then
    raise exception 'Checkout page is not active.' using errcode = '22023';
  end if;

  select * into target_settings from public.store_settings where store_id = target_store.id limit 1;
  select * into target_subscription from public.subscriptions where store_id = target_store.id limit 1;

  if public.current_month_order_count(target_store.id) >= coalesce(target_subscription.orders_limit, public.orderflow_plan_limit(target_subscription.plan)) then
    insert into public.notifications (store_id, title, message, type, action_url)
    values (target_store.id, 'Plan limit reached', 'Upgrade plan to accept more orders.', 'plan_limit_reached', '/dashboard/settings?tab=billing');
    raise exception 'Order limit reached for this store.' using errcode = 'P0001';
  end if;

  if jsonb_array_length(order_items_payload) = 0 then
    raise exception 'At least one product is required.' using errcode = '22023';
  end if;

  insert into public.customers (store_id, name, email, phone, country, city, address, orders_count, total_spent)
  values (
    target_store.id,
    name_value,
    email_value,
    phone_value,
    target_store.country,
    city_value,
    address_value,
    0,
    0
  )
  on conflict (store_id, phone_normalized)
  do update set
    name = excluded.name,
    email = coalesce(excluded.email, customers.email),
    city = coalesce(excluded.city, customers.city),
    address = coalesce(excluded.address, customers.address),
    updated_at = now()
  returning id into customer_uuid;

  order_no := public.orderflow_order_number(target_store.id);

  insert into public.orders (store_id, customer_id, order_number, customer_name, phone, email, city, address, status, payment_method, subtotal, total_amount, currency, notes, source)
  values (
    target_store.id,
    customer_uuid,
    order_no,
    name_value,
    phone_value,
    email_value,
    city_value,
    address_value,
    coalesce(target_settings.default_order_status, 'received'),
    'cod',
    0,
    0,
    target_store.currency,
    nullif(trim(coalesce(payload->>'notes', '')), ''),
    'checkout'
  )
  returning id into order_uuid;

  for item in select * from jsonb_array_elements(order_items_payload)
  loop
    select * into product_row
    from public.products
    where id = (item->>'product_id')::uuid
      and store_id = target_store.id
      and status = 'active'
    limit 1;
    if product_row.id is null then
      raise exception 'Product unavailable.' using errcode = '22023';
    end if;
    quantity_value := greatest(1, coalesce((item->>'quantity')::integer, 1));
    subtotal_amount := subtotal_amount + (product_row.price * quantity_value);
    insert into public.order_items (order_id, product_id, product_name, product_image_url, quantity, unit_price, total_price, selected_options)
    values (
      order_uuid,
      product_row.id,
      product_row.name,
      product_row.image_url,
      quantity_value,
      product_row.price,
      product_row.price * quantity_value,
      coalesce(
        item->'selected_options',
        jsonb_strip_nulls(jsonb_build_object(
          'size', item->>'size',
          'color', item->>'color',
          'variant', item->>'variant_label',
          'custom_fields', item->'custom_fields'
        ))
      )
    );
    update public.products
    set stock = greatest(0, stock - quantity_value),
        orders_count = orders_count + quantity_value
    where id = product_row.id;
  end loop;

  update public.orders
  set subtotal = subtotal_amount, total_amount = subtotal_amount
  where id = order_uuid;

  update public.customers
  set orders_count = orders_count + 1,
      total_spent = total_spent + subtotal_amount
  where id = customer_uuid;

  for field_key, field_value in select * from jsonb_each(custom_fields_payload)
  loop
    insert into public.order_custom_field_values (order_id, field_label, field_type, value)
    values (order_uuid, field_key, 'text', field_value);
  end loop;

  insert into public.order_timeline (order_id, status, note)
  values (order_uuid, coalesce(target_settings.default_order_status, 'received'), 'Order received from public checkout.');

  insert into public.notifications (store_id, title, message, type, action_url)
  values (target_store.id, 'New order received', name_value || ' placed ' || order_no || '.', 'new_order', '/dashboard/orders?order=' || order_no);

  insert into public.activity_logs (store_id, type, message, metadata)
  values (target_store.id, 'new_order', 'New order ' || order_no || ' received.', jsonb_build_object('order_id', order_uuid, 'order_number', order_no));

  return jsonb_build_object('order_id', order_uuid, 'order_number', order_no, 'store_slug', target_store.slug);
end;
$$;

create or replace function public.track_orders_by_phone(store_slug text, phone text)
returns table (
  order_id uuid,
  order_number text,
  status text,
  created_at timestamptz,
  total_amount numeric,
  currency text,
  product_name text,
  quantity integer,
  selected_options jsonb,
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
    o.status,
    o.created_at,
    o.total_amount,
    o.currency,
    coalesce(oi.product_name, 'Order') as product_name,
    coalesce(oi.quantity, 1) as quantity,
    coalesce(oi.selected_options, '{}'::jsonb) as selected_options,
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
    select product_name, quantity, selected_options
    from public.order_items
    where order_id = o.id
    order by created_at asc
    limit 1
  ) oi on true
  where s.slug = track_orders_by_phone.store_slug
    and regexp_replace(o.phone, '\D', '', 'g') = regexp_replace(track_orders_by_phone.phone, '\D', '', 'g')
  order by o.created_at desc;
$$;

revoke all on function public.create_checkout_order(jsonb) from public;
grant execute on function public.create_checkout_order(jsonb) to anon, authenticated;
revoke all on function public.track_orders_by_phone(text, text) from public;
grant execute on function public.track_orders_by_phone(text, text) to anon, authenticated;
revoke all on function public.set_updated_at() from public;
revoke all on function public.create_profile_for_new_user() from public;
revoke all on function public.orderflow_order_number(uuid) from public;
revoke all on function public.orderflow_plan_limit(text) from public;
revoke all on function public.is_admin() from public;
revoke all on function public.owns_store(uuid) from public;
revoke all on function public.current_user_store_id() from public;
revoke all on function public.current_month_order_count(uuid) from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_store(uuid) to authenticated;
grant execute on function public.current_user_store_id() to authenticated;
grant execute on function public.current_month_order_count(uuid) to authenticated;

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('store-logos', 'store-logos', true, 2000000, array['image/png','image/jpeg','image/svg+xml','image/webp'])
  on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('product-images', 'product-images', true, 10000000, array['image/png','image/jpeg','image/webp'])
  on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
end $$;

do $$
begin
  drop policy if exists "public can read store logos" on storage.objects;
  drop policy if exists "public can read product images" on storage.objects;
  drop policy if exists "owners can upload store logos" on storage.objects;
  drop policy if exists "owners can update store logos" on storage.objects;
  drop policy if exists "owners can delete store logos" on storage.objects;
  drop policy if exists "owners can upload product images" on storage.objects;
  drop policy if exists "owners can update product images" on storage.objects;
  drop policy if exists "owners can delete product images" on storage.objects;

  drop policy if exists "profiles owner select" on public.profiles;
  drop policy if exists "profiles owner insert" on public.profiles;
  drop policy if exists "profiles owner update" on public.profiles;
  drop policy if exists "stores owner all" on public.stores;
  drop policy if exists "stores public active checkout read" on public.stores;
  drop policy if exists "store settings owner all" on public.store_settings;
  drop policy if exists "store settings public read" on public.store_settings;
  drop policy if exists "products owner all" on public.products;
  drop policy if exists "products public active read" on public.products;
  drop policy if exists "product options owner all" on public.product_options;
  drop policy if exists "product options public read" on public.product_options;
  drop policy if exists "product option values owner all" on public.product_option_values;
  drop policy if exists "product option values public read" on public.product_option_values;
  drop policy if exists "product custom fields owner all" on public.product_custom_fields;
  drop policy if exists "product custom fields public read" on public.product_custom_fields;
  drop policy if exists "checkout pages owner all" on public.checkout_pages;
  drop policy if exists "checkout pages public active read" on public.checkout_pages;
  drop policy if exists "checkout fields owner all" on public.checkout_fields;
  drop policy if exists "checkout fields public active read" on public.checkout_fields;
  drop policy if exists "customers owner all" on public.customers;
  drop policy if exists "customer custom fields owner all" on public.customer_custom_fields;
  drop policy if exists "customer custom values owner all" on public.customer_custom_field_values;
  drop policy if exists "orders owner all" on public.orders;
  drop policy if exists "order items owner all" on public.order_items;
  drop policy if exists "order custom values owner all" on public.order_custom_field_values;
  drop policy if exists "order timeline owner all" on public.order_timeline;
  drop policy if exists "notifications owner all" on public.notifications;
  drop policy if exists "activity logs owner all" on public.activity_logs;
  drop policy if exists "subscriptions owner select" on public.subscriptions;
  drop policy if exists "subscriptions owner insert" on public.subscriptions;
  drop policy if exists "subscriptions owner update" on public.subscriptions;
  drop policy if exists "subscriptions admin update" on public.subscriptions;
end $$;

create policy "public can read store logos" on storage.objects for select to anon, authenticated using (bucket_id = 'store-logos');
create policy "public can read product images" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "owners can upload store logos" on storage.objects for insert to authenticated with check (bucket_id = 'store-logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can update store logos" on storage.objects for update to authenticated using (bucket_id = 'store-logos' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'store-logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can delete store logos" on storage.objects for delete to authenticated using (bucket_id = 'store-logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners can delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "profiles owner select" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "profiles owner insert" on public.profiles for insert to authenticated with check (id = (select auth.uid()) and (role = 'owner' or lower(email) = 'zainali00490@gmail.com'));
create policy "profiles owner update" on public.profiles for update to authenticated using (id = (select auth.uid()) or public.is_admin()) with check (public.is_admin() or (id = (select auth.uid()) and (role = 'owner' or lower(email) = 'zainali00490@gmail.com')));

create policy "stores owner all" on public.stores for all to authenticated using (owner_id = (select auth.uid()) or public.is_admin()) with check (owner_id = (select auth.uid()) or public.is_admin());
create policy "stores public active checkout read" on public.stores for select to anon using (exists (select 1 from public.checkout_pages cp where cp.store_id = stores.id and cp.is_active));

create policy "store settings owner all" on public.store_settings for all to authenticated using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
create policy "store settings public read" on public.store_settings for select to anon using (exists (select 1 from public.checkout_pages cp where cp.store_id = store_settings.store_id and cp.is_active));

create policy "products owner all" on public.products for all to authenticated using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
create policy "products public active read" on public.products for select to anon using (status = 'active' and exists (select 1 from public.checkout_pages cp where cp.store_id = products.store_id and cp.is_active));

create policy "product options owner all" on public.product_options for all to authenticated using (exists (select 1 from public.products p where p.id = product_options.product_id and (public.owns_store(p.store_id) or public.is_admin()))) with check (exists (select 1 from public.products p where p.id = product_options.product_id and (public.owns_store(p.store_id) or public.is_admin())));
create policy "product options public read" on public.product_options for select to anon using (exists (select 1 from public.products p join public.checkout_pages cp on cp.store_id = p.store_id and cp.is_active where p.id = product_options.product_id and p.status = 'active'));
create policy "product option values owner all" on public.product_option_values for all to authenticated using (exists (select 1 from public.product_options po join public.products p on p.id = po.product_id where po.id = product_option_values.option_id and (public.owns_store(p.store_id) or public.is_admin()))) with check (exists (select 1 from public.product_options po join public.products p on p.id = po.product_id where po.id = product_option_values.option_id and (public.owns_store(p.store_id) or public.is_admin())));
create policy "product option values public read" on public.product_option_values for select to anon using (exists (select 1 from public.product_options po join public.products p on p.id = po.product_id join public.checkout_pages cp on cp.store_id = p.store_id and cp.is_active where po.id = product_option_values.option_id and p.status = 'active'));
create policy "product custom fields owner all" on public.product_custom_fields for all to authenticated using (exists (select 1 from public.products p where p.id = product_custom_fields.product_id and (public.owns_store(p.store_id) or public.is_admin()))) with check (exists (select 1 from public.products p where p.id = product_custom_fields.product_id and (public.owns_store(p.store_id) or public.is_admin())));
create policy "product custom fields public read" on public.product_custom_fields for select to anon using (enabled and exists (select 1 from public.products p join public.checkout_pages cp on cp.store_id = p.store_id and cp.is_active where p.id = product_custom_fields.product_id and p.status = 'active'));

create policy "checkout pages owner all" on public.checkout_pages for all to authenticated using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
create policy "checkout pages public active read" on public.checkout_pages for select to anon using (is_active);
create policy "checkout fields owner all" on public.checkout_fields for all to authenticated using (exists (select 1 from public.checkout_pages cp where cp.id = checkout_fields.checkout_page_id and (public.owns_store(cp.store_id) or public.is_admin()))) with check (exists (select 1 from public.checkout_pages cp where cp.id = checkout_fields.checkout_page_id and (public.owns_store(cp.store_id) or public.is_admin())));
create policy "checkout fields public active read" on public.checkout_fields for select to anon using (enabled and exists (select 1 from public.checkout_pages cp where cp.id = checkout_fields.checkout_page_id and cp.is_active));

create policy "customers owner all" on public.customers for all to authenticated using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
create policy "customer custom fields owner all" on public.customer_custom_fields for all to authenticated using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
create policy "customer custom values owner all" on public.customer_custom_field_values for all to authenticated using (exists (select 1 from public.customers c where c.id = customer_custom_field_values.customer_id and (public.owns_store(c.store_id) or public.is_admin()))) with check (exists (select 1 from public.customers c where c.id = customer_custom_field_values.customer_id and (public.owns_store(c.store_id) or public.is_admin())));

create policy "orders owner all" on public.orders for all to authenticated using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
create policy "order items owner all" on public.order_items for all to authenticated using (exists (select 1 from public.orders o where o.id = order_items.order_id and (public.owns_store(o.store_id) or public.is_admin()))) with check (exists (select 1 from public.orders o where o.id = order_items.order_id and (public.owns_store(o.store_id) or public.is_admin())));
create policy "order custom values owner all" on public.order_custom_field_values for all to authenticated using (exists (select 1 from public.orders o where o.id = order_custom_field_values.order_id and (public.owns_store(o.store_id) or public.is_admin()))) with check (exists (select 1 from public.orders o where o.id = order_custom_field_values.order_id and (public.owns_store(o.store_id) or public.is_admin())));
create policy "order timeline owner all" on public.order_timeline for all to authenticated using (exists (select 1 from public.orders o where o.id = order_timeline.order_id and (public.owns_store(o.store_id) or public.is_admin()))) with check (exists (select 1 from public.orders o where o.id = order_timeline.order_id and (public.owns_store(o.store_id) or public.is_admin())));

create policy "notifications owner all" on public.notifications for all to authenticated using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
create policy "activity logs owner all" on public.activity_logs for all to authenticated using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
create policy "subscriptions owner select" on public.subscriptions for select to authenticated using (public.owns_store(store_id) or public.is_admin());
create policy "subscriptions owner insert" on public.subscriptions for insert to authenticated with check (public.owns_store(store_id) or public.is_admin());
create policy "subscriptions owner update" on public.subscriptions for update to authenticated using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
