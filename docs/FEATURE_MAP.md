# Feature Map

## Auth

What it does:

- Login, signup, password reset, logout.
- Supabase Auth when configured, mock fallback otherwise.
- Protected dashboard/admin routes.
- Admin detection from database profile role plus known admin email fallback.

Files:

- `components/auth/auth-provider.tsx`
- `components/public/auth-pages.tsx`
- `components/auth/protected-account-gate.tsx`
- `app/(protected)/layout.tsx`
- `app/(protected)/admin/page.tsx`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `lib/server-auth.ts`

Tables:

- `profiles`
- `stores`
- `subscriptions`

Status:

- Built. Needs real-account redirect and status testing.

## Onboarding

What it does:

- First seller setup.
- Captures store name/category/country/currency/basic checkout requirements.
- Creates/updates store, settings, checkout page, and free subscription.

Files:

- `components/public/onboarding-page.tsx`
- `lib/supabase/data.ts`

Tables:

- `stores`
- `store_settings`
- `checkout_pages`
- `subscriptions`

Status:

- Built. Needs full production signup-to-dashboard QA.

## Dashboard

What it does:

- Overview stats, recent orders, quick actions, activity/notifications.
- Shared dashboard state provider loads Supabase data and exposes mutations.

Files:

- `components/dashboard/dashboard-store.tsx`
- `components/dashboard/dashboard-shell.tsx`
- `components/dashboard/overview-page.tsx`

Tables:

- `orders`
- `products`
- `customers`
- `notifications`
- `subscriptions`

Status:

- Built. Needs repeated QA after each Supabase schema change.

## Products

What it does:

- Create/edit/delete/archive products.
- Product options: sizes/colors/custom fields.
- Product image support.
- Grid/list UI and modal form.

Files:

- `components/dashboard/products-page.tsx`
- `components/dashboard/product-form-modal.tsx`
- `components/dashboard/dashboard-store.tsx`
- `lib/supabase/data.ts`

Tables:

- `products`
- `product_options`
- `product_option_values`
- `product_custom_fields`

Storage:

- `product-images`

Status:

- Built. Needs storage-limit and upload-policy QA.

## Checkout Builder

What it does:

- Store branding, colors, logo, checkout behavior, custom checkout fields.
- Copy/open checkout link.
- Live preview.

Files:

- `components/dashboard/checkout-page.tsx`
- `components/dashboard/settings-page.tsx`
- `lib/supabase/data.ts`
- `lib/supabase/mappers.ts`

Tables:

- `store_settings`
- `checkout_pages`
- `checkout_fields`

Status:

- Built. Settings and builder must stay synchronized.

## Public Checkout

What it does:

- Customer-facing checkout at `/checkout/[storeId]`.
- Loads public store, checkout settings, active products/options.
- Supports COD, required fields, custom fields, multiple products.
- Submits order via `create_checkout_order` RPC when Supabase is configured.

Files:

- `components/public/public-checkout-page.tsx`
- `app/(public)/checkout/[storeId]/page.tsx`
- `lib/supabase/mappers.ts`

Tables/RPC:

- Public limited read: `stores`, `store_settings`, `checkout_pages`, `checkout_fields`, `products`, `product_options`, `product_option_values`, `product_custom_fields`
- RPC: `create_checkout_order(payload jsonb)`

Status:

- Built. Needs real seller checkout QA.

## Thank You Page

What it does:

- Shows receipt/order summary and seller thank-you message.
- Shows Track My Order button only if tracking is enabled.

Files:

- `components/public/checkout-success-page.tsx`
- `app/(public)/checkout/success/page.tsx`

Tables/RPC:

- Uses `track_orders_by_phone` for Supabase order lookup.

Status:

- Built. Needs multi-item receipt edge-case QA.

## Tracking Page

What it does:

- Customer enters phone number.
- Shows limited customer-facing order details.
- If seller disabled tracking, shows disabled message.

Files:

- `components/public/track-page.tsx`
- `app/(public)/track/page.tsx`

RPC:

- `track_orders_by_phone(store_slug text, phone text)`

Status:

- Built. Needs testing with real order data.

## Orders

What it does:

- Search/filter orders.
- Create order from existing products.
- View/edit/delete order.
- Update status and timeline.
- CSV export.

Files:

- `components/dashboard/orders-page.tsx`
- `components/dashboard/dashboard-store.tsx`
- `components/dashboard/shared.tsx`
- `lib/csv.ts`

Tables:

- `orders`
- `order_items`
- `order_timeline`
- `order_custom_field_values`
- `customers`

Status:

- Built. Needs status-update and RLS regression testing.

## Customers

What it does:

- Search customers.
- Profile drawer, notes, order history.
- Repeat customer indicators.
- CSV export.

Files:

- `components/dashboard/customers-page.tsx`
- `components/dashboard/dashboard-store.tsx`

Tables:

- `customers`
- `customer_custom_fields`
- `customer_custom_field_values`
- `orders`

Status:

- Built. Needs real order/customer merge QA.

## Analytics

What it does:

- Calculates revenue/orders/customers/repeat customers/top products/status breakdown from loaded rows.
- CSV export.

Files:

- `components/dashboard/analytics-page.tsx`
- `lib/analytics.ts`

Tables:

- Derived from `orders`, `order_items`, `customers`, `products`.

Status:

- Built. Needs data accuracy QA with real stores.

## Notifications

What it does:

- Shows dashboard notifications.
- Filters visible notifications to new order/customer-related types in dashboard provider.
- Supports mark read.

Files:

- `components/dashboard/dashboard-shell.tsx`
- `components/dashboard/dashboard-store.tsx`

Tables:

- `notifications`

Status:

- Built. Needs notification type review as features expand.

## Admin

What it does:

- Admin-only access.
- Users/stores/messages/analytics.
- Plan changes.
- Account status changes.
- Admin access grant/remove.
- Contact message review and status updates.

Files:

- `app/(protected)/admin/page.tsx`
- `components/admin/admin-page.tsx`
- `components/auth/auth-provider.tsx`

Tables:

- `profiles`
- `stores`
- `subscriptions`
- `contact_submissions`

Status:

- Built. Needs admin/non-admin account testing.

## Contact Form

What it does:

- Public form at `/contact`.
- Saves name, email, subject, message to Supabase `contact_submissions`.
- Admin reviews messages in `/admin` > Messages.
- Falls back to localStorage when Supabase is not configured.

Files:

- `components/public/contact-page.tsx`
- `components/admin/admin-page.tsx`
- `lib/storage.ts`

Tables:

- `contact_submissions`

Status:

- Built and public insert tested through Supabase REST with `return=minimal`.

