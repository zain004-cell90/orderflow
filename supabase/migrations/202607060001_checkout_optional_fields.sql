alter table public.store_settings
  add column if not exists email_field_enabled boolean not null default true,
  add column if not exists referral_field_enabled boolean not null default false,
  add column if not exists gift_note_field_enabled boolean not null default false;

drop policy if exists "stores authenticated public active checkout read" on public.stores;
create policy "stores authenticated public active checkout read"
on public.stores for select to authenticated
using (exists (select 1 from public.checkout_pages cp where cp.store_id = stores.id and cp.is_active));

drop policy if exists "store settings authenticated public read" on public.store_settings;
create policy "store settings authenticated public read"
on public.store_settings for select to authenticated
using (exists (select 1 from public.checkout_pages cp where cp.store_id = store_settings.store_id and cp.is_active));

drop policy if exists "products authenticated public active read" on public.products;
create policy "products authenticated public active read"
on public.products for select to authenticated
using (status = 'active' and exists (select 1 from public.checkout_pages cp where cp.store_id = products.store_id and cp.is_active));

drop policy if exists "product options authenticated public read" on public.product_options;
create policy "product options authenticated public read"
on public.product_options for select to authenticated
using (exists (select 1 from public.products p join public.checkout_pages cp on cp.store_id = p.store_id and cp.is_active where p.id = product_options.product_id and p.status = 'active'));

drop policy if exists "product option values authenticated public read" on public.product_option_values;
create policy "product option values authenticated public read"
on public.product_option_values for select to authenticated
using (exists (select 1 from public.product_options po join public.products p on p.id = po.product_id join public.checkout_pages cp on cp.store_id = p.store_id and cp.is_active where po.id = product_option_values.option_id and p.status = 'active'));

drop policy if exists "product custom fields authenticated public read" on public.product_custom_fields;
create policy "product custom fields authenticated public read"
on public.product_custom_fields for select to authenticated
using (enabled and exists (select 1 from public.products p join public.checkout_pages cp on cp.store_id = p.store_id and cp.is_active where p.id = product_custom_fields.product_id and p.status = 'active'));

drop policy if exists "checkout pages authenticated public active read" on public.checkout_pages;
create policy "checkout pages authenticated public active read"
on public.checkout_pages for select to authenticated
using (is_active);

drop policy if exists "checkout fields authenticated public active read" on public.checkout_fields;
create policy "checkout fields authenticated public active read"
on public.checkout_fields for select to authenticated
using (enabled and exists (select 1 from public.checkout_pages cp where cp.id = checkout_fields.checkout_page_id and cp.is_active));
