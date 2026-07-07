# Supabase Context

## Project Ref

`rucsowndqbckpepwinnp`

Project URL:

`https://rucsowndqbckpepwinnp.supabase.co`

## Environment Variables

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
```

Do not expose a Supabase service-role key in frontend code or any `NEXT_PUBLIC_` variable.

## Tables

### `profiles`

Purpose: user profile and app role.

Important columns: `id`, `email`, `full_name`, `role`, `account_status`.

Relationship: `id` references `auth.users`.

Security: user can access own profile; admins can access all.

### `stores`

Purpose: seller store identity.

Important columns: `owner_id`, `name`, `slug`, `logo_url`, `country`, `currency`, `is_setup_complete`.

Relationship: `owner_id` links to `profiles.id`.

Security: owner or admin.

### `store_settings`

Purpose: checkout behavior and branding settings.

Important columns: `phone_required`, `address_required`, `city_required`, `order_tracking_enabled`, `allow_multiple_products`, `cod_enabled`, `thank_you_message`, colors.

Relationship: one row per store.

Security: owner or admin; limited public read for checkout behavior.

### `products`

Purpose: seller products.

Important columns: `store_id`, `name`, `price`, `image_url`, `status`, `stock`, `orders_count`.

Security: owner/admin full access; active products public-readable for checkout.

### `product_options`

Purpose: option groups like Size or Color.

Relationship: belongs to `products`.

Security: owner/admin; public read for active checkout products.

### `product_option_values`

Purpose: values under product options.

Relationship: belongs to `product_options`.

Security: owner/admin; public read for active checkout products.

### `product_custom_fields`

Purpose: custom fields attached to a product, shown in product section on checkout.

Relationship: belongs to `products`.

Security: owner/admin; public read for active checkout products.

### `checkout_pages`

Purpose: public checkout page config and selected product defaults.

Relationship: one per store.

Security: owner/admin; limited public read.

### `checkout_fields`

Purpose: custom checkout-level customer fields.

Relationship: belongs to `checkout_pages`.

Security: owner/admin; limited public read.

### `customers`

Purpose: seller customer database.

Relationship: belongs to store.

Security: owner/admin only.

### `customer_custom_fields`

Purpose: configurable seller customer fields.

Relationship: belongs to store.

Security: owner/admin only.

### `customer_custom_field_values`

Purpose: values for custom customer fields.

Relationship: belongs to customer.

Security: owner/admin only.

### `orders`

Purpose: order header rows.

Important columns: `store_id`, `customer_id`, `order_number`, `status`, `payment_method`, totals, delivery info.

Security: owner/admin; public insert only through RPC; limited public tracking through RPC.

### `order_items`

Purpose: line items/products in an order.

Relationship: belongs to `orders`.

Security: owner/admin; limited tracking output via RPC.

### `order_custom_field_values`

Purpose: checkout custom field values stored against orders.

Relationship: belongs to `orders`.

Security: owner/admin; limited tracking output via RPC.

### `order_timeline`

Purpose: order status history.

Relationship: belongs to `orders`.

Security: owner/admin; limited tracking output via RPC.

### `notifications`

Purpose: dashboard notifications.

Relationship: belongs to store.

Security: owner/admin.

### `activity_logs`

Purpose: internal activity history.

Relationship: belongs to store.

Security: owner/admin.

### `subscriptions`

Purpose: seller plan and order limit.

Important columns: `store_id`, `plan`, `orders_limit`, `monthly_orders_used`, `status`.

Security: owner select/insert/update; admin can manage all through RLS.

### `contact_submissions`

Purpose: public contact form submissions reviewed by admin.

Important columns: `full_name`, `email`, `subject`, `message`, `status`, `source`.

Security: public insert; authenticated admins select/update/delete.

## RPC Functions

### `create_checkout_order(payload jsonb)`

Used by public checkout to create an order without exposing private seller tables.

Responsibilities:

- Resolve store by slug.
- Enforce checkout active state and plan limits.
- Upsert customer.
- Insert order and order items.
- Insert custom field values and timeline.
- Create notification/activity.
- Return order number/id.

### `track_orders_by_phone(store_slug text, phone text)`

Used by public tracking and thank-you page.

Responsibilities:

- Resolve store by slug.
- Return only limited customer-facing order data.
- Avoid exposing private dashboard-only seller data.

## RLS Model

- Store owners access only their own store data.
- Admins can access all protected data through `is_admin()`.
- Public checkout has limited read on active public store/product/checkout data.
- Public order creation must go through `create_checkout_order`.
- Public tracking must go through `track_orders_by_phone`.
- Normal users cannot access `/admin` unless their database profile role is admin.

## Storage

Buckets:

- `store-logos`
- `product-images`

Expected rules:

- Public read for images.
- Authenticated owner upload/update/delete only in their store-owned path.

## Migrations

Migrations live in `supabase/migrations/`.

Rules:

- New database changes should create new migration files.
- Do not randomly edit already-applied migrations.
- Apply migrations through Supabase SQL Editor, Supabase CLI, or MCP.
- After database changes, test RLS as anon, normal owner, another owner, and admin.

