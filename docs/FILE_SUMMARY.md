# File Summary

This summary focuses on important files a future Codex account should know first.

## `app/layout.tsx`

Purpose: root HTML layout, Inter font variable, global accessibility manager.

Related: all routes.

Risk: hydration warnings may come from browser extensions, but avoid server/client mismatch here.

## `app/globals.css`

Purpose: global CSS for marketing, public checkout, dashboard, admin, modals, responsive behavior.

Related: entire UI.

Risk: large file; small style changes can affect many pages.

## `app/(public)/page.tsx`

Purpose: landing page route.

Component: `components/marketing/landing-page.tsx`.

## `app/(public)/contact/page.tsx`

Purpose: contact route.

Component: `components/public/contact-page.tsx`.

Data: Supabase `contact_submissions` with local fallback.

## `app/(public)/checkout/[storeId]/page.tsx`

Purpose: public checkout route for a seller store slug/id.

Component: `components/public/public-checkout-page.tsx`.

Data: Supabase public reads and `create_checkout_order` RPC.

## `app/(public)/checkout/success/page.tsx`

Purpose: order thank-you/receipt route.

Component: `components/public/checkout-success-page.tsx`.

Data: `track_orders_by_phone` RPC when store/phone params exist.

## `app/(public)/track/page.tsx`

Purpose: customer tracking route.

Component: `components/public/track-page.tsx`.

Data: `track_orders_by_phone` RPC or local fallback.

## `app/(protected)/layout.tsx`

Purpose: protected route wrapper.

Components: `AuthProvider`, `ProtectedAccountGate`.

Risk: auth/redirect changes affect all dashboard/admin pages.

## `app/(protected)/admin/page.tsx`

Purpose: admin-only route guard and admin page render.

Data: Supabase server client checks profile role.

Risk: admin authorization must remain server-side, not just client-side.

## `components/marketing/landing-page.tsx`

Purpose: landing page sections, pricing, CTA links.

Data: static.

Risk: user has repeatedly requested no redesign unless explicitly asked.

## `components/marketing/marketing-chrome.tsx`

Purpose: marketing/public header and footer.

Data: `lib/routes.ts`.

Risk: header/footer links affect public navigation.

## `components/marketing/stitch-sections.tsx`

Purpose: Stitch-inspired landing page mockup sections.

Data: static.

Risk: pixel parity matters.

## `components/public/auth-pages.tsx`

Purpose: login/signup/forgot/reset/check-email UI and form flows.

Data: `useAuth()`.

Related tables: `profiles`, Supabase Auth.

Risk: auth redirect URL correctness.

## `components/public/onboarding-page.tsx`

Purpose: first-time seller setup.

Important logic: store profile, logo upload, checkout defaults, creates Supabase store/subscription.

Data: `createOrUpdateStoreFromOnboarding`, storage fallback.

Related tables: `stores`, `store_settings`, `checkout_pages`, `subscriptions`.

## `components/public/contact-page.tsx`

Purpose: public contact form.

Important logic: validates/sanitizes fields, inserts into Supabase `contact_submissions`, local fallback.

Related tables: `contact_submissions`.

Risk: public insert must not allow public read.

## `components/public/public-checkout-page.tsx`

Purpose: public checkout.

Important logic: load public store/products/config, single or multi-product cart, required fields, custom fields, plan-limit handling, submit order.

Data source: Supabase public reads + `create_checkout_order` RPC; local fallback.

Related tables: `stores`, `store_settings`, `checkout_pages`, `checkout_fields`, `products`, `product_options`, `product_option_values`, `product_custom_fields`.

Risk: payload shape must match RPC; RLS must not expose private data.

## `components/public/checkout-success-page.tsx`

Purpose: thank-you/receipt page.

Important logic: reads order by phone/store through tracking RPC; uses session checkout config for immediate thank-you message.

Risk: direct refresh without phone/store may show order not found.

## `components/public/track-page.tsx`

Purpose: public tracking by phone number.

Important logic: checks tracking enabled, calls tracking RPC, displays limited order details and timeline.

Risk: must not show private seller/customer data.

## `components/public/legal-page.tsx`

Purpose: privacy/terms content.

Data: static.

## `components/admin/admin-page.tsx`

Purpose: admin control panel.

Important logic: users/stores/messages/analytics tabs; plan changes; account status; admin access; contact message status.

Data source: `useAuth()` for users/stores, Supabase `contact_submissions` for messages.

Related tables: `profiles`, `stores`, `subscriptions`, `contact_submissions`.

Risk: current admin must not delete/block/remove admin access from self.

## `components/auth/auth-provider.tsx`

Purpose: client auth state provider.

Important logic: Supabase Auth login/signup/logout/reset; mock fallback; user/store mapping; update plans/status/roles.

Related tables: `profiles`, `stores`, `subscriptions`.

Risk: keep DB roles as `admin`/`owner`, mapped to frontend `admin`/`user`.

## `components/auth/protected-account-gate.tsx`

Purpose: blocks suspended/blocked/deleted accounts and shows support CTA.

Data: `useAuth()`.

## `components/dashboard/dashboard-store.tsx`

Purpose: dashboard state provider and mutation layer.

Important logic: loads Supabase dashboard data; creates/updates/deletes orders/products/customers; notifications; toasts; confirmations.

Data: Supabase via `lib/supabase/data.ts`, local fallback when Supabase disabled.

Related tables: most seller-owned tables.

Risk: high-impact file; test after edits.

## `components/dashboard/dashboard-shell.tsx`

Purpose: sidebar/topbar/mobile nav, global search, notifications, user menu.

Data: `useAuth()`, `useDashboard()`.

Risk: dashboard navigation and admin nav visibility.

## `components/dashboard/overview-page.tsx`

Purpose: dashboard overview stats, recent orders, quick actions, activity feed.

Data: `useDashboard()`.

## `components/dashboard/orders-page.tsx`

Purpose: orders management.

Important logic: search/filter/status/update/detail drawer/export/create order.

Data: `useDashboard()`.

Related tables: `orders`, `order_items`, `order_timeline`, `customers`.

## `components/dashboard/products-page.tsx`

Purpose: products inventory.

Important logic: search/filter/grid/list/product actions/modal.

Data: `useDashboard()`.

Related tables: `products`, `product_options`, `product_option_values`, `product_custom_fields`.

## `components/dashboard/product-form-modal.tsx`

Purpose: add/edit product modal.

Important logic: product fields, image, options, custom product fields.

Risk: product custom fields should show under product section on public checkout.

## `components/dashboard/customers-page.tsx`

Purpose: customer database.

Important logic: search/profile drawer/notes/order history/export.

Data: `useDashboard()`.

## `components/dashboard/checkout-page.tsx`

Purpose: checkout builder page.

Important logic: branding, colors, custom fields, copy/open link, preview, save/reset.

Data: `useDashboard()`, `saveCheckoutConfig`.

## `components/dashboard/settings-page.tsx`

Purpose: store/account/checkout/billing/automation settings.

Important logic: checkout behavior toggles, tracking sync, billing plan UI, account profile.

Data: `useDashboard()`, `useAuth()`, Supabase save helpers.

Risk: settings and checkout builder must stay in sync.

## `components/dashboard/analytics-page.tsx`

Purpose: analytics dashboard and CSV export.

Data: `lib/analytics.ts`.

## `components/dashboard/plan-limit.tsx`

Purpose: frontend plan-limit modal and hook.

Data: `useAuth()`, `lib/mock-auth.ts` plan limits.

Risk: Supabase RPC also enforces limits; keep frontend and DB aligned.

## `lib/types.ts`

Purpose: shared TypeScript types for orders/products/customers/settings/auth/admin/contact.

Risk: type changes affect many components.

## `lib/routes.ts`

Purpose: central route constants and navigation configs.

Risk: avoid hardcoded route drift.

## `lib/storage.ts`

Purpose: localStorage fallback helpers.

Data: used for mock/dev fallback and some session-only support.

Risk: do not use as production source of truth when Supabase is connected.

## `lib/mock-auth.ts`

Purpose: mock auth fallback, plan limits, admin email, seeded users/stores.

Risk: `AUTH_COOKIE` is mock-only; production auth uses Supabase.

## `lib/mock-data.ts`

Purpose: default checkout config and legacy mock product/order/customer data.

Risk: legacy demo data is filtered by `lib/storage.ts`; do not reintroduce fake data into production paths.

## `lib/csv.ts`

Purpose: CSV export helper.

Important logic: escapes commas/quotes/newlines and prefixes spreadsheet formulas.

Risk: keep formula-injection protection.

## `lib/validation.ts`

Purpose: sanitizers for text/email/phone/multiline/images.

Risk: use before storing user input.

## `lib/analytics.ts`

Purpose: analytics calculations from order/customer/product arrays.

Data: loaded dashboard rows.

## `lib/supabase/config.ts`

Purpose: Supabase URL/key config with fallback.

Risk: never put service-role key here.

## `lib/supabase/client.ts`

Purpose: browser Supabase client and session cleanup.

Risk: used by client components only.

## `lib/supabase/server.ts`

Purpose: server Supabase client for App Router server checks.

Risk: cookie refresh is handled with middleware/server client separation.

## `lib/supabase/middleware.ts`

Purpose: Supabase session refresh middleware.

Risk: auth redirects depend on this.

## `lib/supabase/data.ts`

Purpose: Supabase data-access and mutations.

Important exports: `loadDashboardData`, `createOrUpdateStoreFromOnboarding`, product/order/customer/settings save helpers.

Risk: RLS failures usually surface here.

## `lib/supabase/mappers.ts`

Purpose: maps DB rows/enums to UI types and UI types to DB values.

Risk: keep status/plan/field-type mappings aligned with migrations.

## `lib/supabase/errors.ts`

Purpose: Supabase error helpers.

## `supabase/migrations/202607020001_orderflow_phase3.sql`

Purpose: main schema, RLS, storage, RPC setup.

Risk: already applied; avoid editing unless explicitly instructed.

## `supabase/migrations/202607060001_checkout_optional_fields.sql`

Purpose: checkout optional field columns.

## `supabase/migrations/202607060001_expand_order_payment_methods.sql`

Purpose: expands order payment methods.

## `supabase/migrations/202607060002_expand_tracking_receipt_data.sql`

Purpose: expands data returned for tracking/receipt.

## `supabase/migrations/202607070001_add_contact_submissions.sql`

Purpose: contact form submissions table, RLS, grants.

Security: public insert only; admin read/update/delete.

