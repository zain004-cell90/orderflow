# Next Tasks

## 1. Apply Supabase migration if not applied

What to do:

- Confirm all files in `supabase/migrations/` are applied to project `rucsowndqbckpepwinnp`.

Files:

- `supabase/migrations/`

Success test:

- Supabase table list includes all expected tables, including `contact_submissions`.

## 2. Add `.env.local`

What to do:

- Ensure local env has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.

Files:

- `.env.local`
- `lib/supabase/config.ts`

Success test:

- `npm run dev` loads without Supabase config errors.

## 3. Test signup/login

Files:

- `components/auth/auth-provider.tsx`
- `components/public/auth-pages.tsx`

Success test:

- Signup creates Supabase user/profile.
- Login redirects to onboarding or dashboard correctly.
- Logout clears session.

## 4. Test onboarding

Files:

- `components/public/onboarding-page.tsx`
- `lib/supabase/data.ts`

Success test:

- Store, settings, checkout page, and Free subscription are created.

## 5. Test product CRUD

Files:

- `components/dashboard/products-page.tsx`
- `components/dashboard/product-form-modal.tsx`
- `components/dashboard/dashboard-store.tsx`

Success test:

- Add/edit/delete product persists to Supabase.
- Product options/custom fields display in checkout.

## 6. Test checkout builder

Files:

- `components/dashboard/checkout-page.tsx`
- `components/dashboard/settings-page.tsx`

Success test:

- Colors, store name, tracking, COD, required fields, and custom fields persist and show on public checkout.

## 7. Test public checkout

Files:

- `components/public/public-checkout-page.tsx`

Success test:

- Customer can submit order through `/checkout/[storeId]`.
- Order appears in dashboard.
- Multiple products work when enabled.

## 8. Test thank-you page

Files:

- `components/public/checkout-success-page.tsx`

Success test:

- Custom thank-you message and order summary display.
- Tracking CTA only appears when tracking is enabled.

## 9. Test tracking

Files:

- `components/public/track-page.tsx`

Success test:

- Phone lookup returns limited order data.
- Disabled tracking shows the correct seller-disabled message.

## 10. Test orders/customers/analytics

Files:

- `components/dashboard/orders-page.tsx`
- `components/dashboard/customers-page.tsx`
- `components/dashboard/analytics-page.tsx`

Success test:

- New checkout orders update all relevant dashboard pages.

## 11. Test admin

Files:

- `components/admin/admin-page.tsx`
- `app/(protected)/admin/page.tsx`

Success test:

- Admin sees users/stores/messages.
- Non-admin cannot access `/admin`.
- Admin can change plan/status/admin access.

## 12. Fix RLS bugs

Files:

- `supabase/migrations/`
- `lib/supabase/data.ts`

Success test:

- Owner cannot read another owner data.
- Admin can manage all.
- Public checkout can only access public data.

## 13. Deploy to Vercel

Files:

- GitHub repo and Vercel project settings.

Success test:

- Production deployment is `READY`.

## 14. Update Supabase Auth redirect URLs

What to do:

- Add local and production URLs in Supabase Auth settings.

Success test:

- Password reset and email confirmation links open production domain, not localhost.

## 15. Start real seller testing

What to do:

- Create a real seller account.
- Add products.
- Share checkout link.
- Place COD test order.
- Track order.

Success test:

- Seller can run the core workflow without developer help.

