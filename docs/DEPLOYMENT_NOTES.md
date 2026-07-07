# Deployment Notes

## Local Setup

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment Variables

Required locally and in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

Do not add a service-role key to frontend/Vercel public env vars.

## Supabase Setup

1. Apply migrations in `supabase/migrations/`.
2. Check all tables exist.
3. Check RLS is enabled.
4. Check storage buckets:
   - `store-logos`
   - `product-images`
5. Check RPC functions:
   - `create_checkout_order`
   - `track_orders_by_phone`
6. Check Supabase Auth redirect URLs.

## Vercel Setup

1. Connect GitHub repo.
2. Add env vars in Vercel project settings.
3. Redeploy production.
4. Set `NEXT_PUBLIC_SITE_URL` to the production domain.

## Supabase Auth URLs

Local:

```text
http://localhost:3000/**
```

Production:

```text
https://your-vercel-domain.vercel.app/**
```

For the current project, production has used:

```text
https://orderflow-eight-eta.vercel.app/**
```

## Post Deploy Smoke Test

- Signup.
- Login.
- Onboarding.
- Add product.
- Open checkout.
- Submit order.
- Thank-you page loads.
- Track order.
- Orders/customers/analytics update.
- CSV export.
- Contact form appears in Admin > Messages.
- Admin access works only for admins.

