# Project Structure

## Root

- `CODEX_CONTEXT.md` — main project handoff entry point.
- `package.json` — scripts and dependencies.
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs` — framework/tooling config.
- `.env.local` — local Supabase/Vercel/public URL environment values. Do not commit secrets.

## `app/`

Next.js App Router routes and global app files.

- `app/layout.tsx` — root HTML layout, font setup, accessibility manager.
- `app/globals.css` — most app styling and responsive CSS.
- `app/(public)/` — public marketing/auth/customer routes.
- `app/(protected)/` — authenticated dashboard/admin route group.
- `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx` — error handling.
- `app/robots.ts`, `app/sitemap.ts` — SEO files.

## `components/`

React page components and reusable UI.

- `components/marketing/` — landing page, landing header/footer, Stitch-inspired sections.
- `components/public/` — auth pages, onboarding, contact, checkout, success, tracking, legal, 404.
- `components/dashboard/` — dashboard shell, provider, pages, product modal, plan limits.
- `components/admin/` — admin panel.
- `components/auth/` — auth provider and protected account gate.
- `components/accessibility-manager.tsx` — client-side accessibility/focus helpers.

## `lib/`

Shared helpers, data types, Supabase integration, CSV export, validation, routing, mock fallback data.

- `lib/types.ts` — central TypeScript interfaces.
- `lib/routes.ts` — route constants and navigation config.
- `lib/storage.ts` — localStorage fallback helpers.
- `lib/mock-auth.ts`, `lib/mock-data.ts` — legacy/mock fallback and plan constants.
- `lib/csv.ts` — CSV download and spreadsheet-injection protection.
- `lib/validation.ts` — sanitizers and validation helpers.
- `lib/supabase/` — Supabase client/server/middleware/data/mappers/errors/config.

## `lib/supabase/`

- `client.ts` — browser Supabase client and local session cleanup.
- `server.ts` — server Supabase client for route checks.
- `middleware.ts` — session refresh middleware.
- `data.ts` — dashboard data loading and mutations.
- `mappers.ts` — database-to-UI mapping and enum conversion.
- `config.ts` — Supabase env config/fallbacks.
- `errors.ts` — Supabase error helpers.

## `supabase/migrations/`

Database migrations. New schema changes should add a new migration file.

Current migrations include:

- Phase 3 schema/RLS/RPC/storage setup.
- Checkout optional fields.
- Expanded order payment methods.
- Expanded tracking/receipt data.
- Contact submissions.

## `docs/`

Project documentation for future Codex/developer handoff.

