# OrderFlow Codex Context

This is the main handoff file for OrderFlow. A new Codex account should read this file first, then read the linked docs in `/docs`.

## Project Overview

OrderFlow helps Instagram, WhatsApp, TikTok, Facebook, and other social sellers collect Cash-on-Delivery order details through one branded checkout link instead of manually asking for name, phone, address, product, size, and color inside DMs.

The core product flow is:

1. Seller creates an account.
2. Seller completes onboarding and store setup.
3. Seller adds products and product options.
4. Seller customizes the checkout page.
5. Seller shares one checkout link.
6. Customer selects product(s), fills COD details, and submits an order.
7. Order appears in the seller dashboard.
8. Customer can track orders by phone number if tracking is enabled.

The app is deployed on Vercel, uses Supabase for Auth/Postgres/Storage/RPC, and keeps the current Stitch-inspired frontend design.

## Current Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS / project CSS in `app/globals.css`
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase RPC functions
- Vercel deployment
- CSV export utilities

## Product Positioning

OrderFlow is **not Shopify**.

OrderFlow is **not a full ecommerce platform**.

OrderFlow is **not a payment gateway**.

OrderFlow is a lightweight COD order collection, dashboard, and tracking tool for social sellers who currently manage orders manually inside DMs.

## Main Routes

- `/` — landing page
- `/login` — login
- `/signup` — signup
- `/onboarding` — first store setup
- `/contact` — public contact form
- `/track` — public order tracking
- `/checkout/[storeId]` — public seller checkout page
- `/checkout/success` — thank-you / receipt page
- `/dashboard` — dashboard overview
- `/dashboard/orders` — orders management
- `/dashboard/products` — products inventory
- `/dashboard/customers` — customers
- `/dashboard/checkout` — checkout builder
- `/dashboard/analytics` — analytics
- `/dashboard/settings` — settings, billing, automation
- `/admin` — admin-only control panel

## Current State

Built:

- Stitch-inspired marketing site and public pages.
- Auth pages and Supabase Auth integration.
- Protected dashboard route group.
- Products, orders, customers, checkout builder, analytics, settings.
- Public checkout, thank-you page, and tracking page.
- CSV exports.
- Admin panel with users, stores, analytics, messages, and plan/admin-access controls.
- Supabase schema, RLS, storage buckets, and RPC functions.
- Contact form submissions stored in Supabase and visible in Admin > Messages.

Still needs careful real-user QA:

- Full Supabase RLS testing as different sellers and admin.
- End-to-end checkout with real seller products.
- Auth redirect URL verification in Supabase dashboard.
- Storage upload limits and policies under real accounts.
- Plan-limit boundary testing.
- Mobile QA on real devices.

## Important Rules for Future Codex

- Do not redesign UI unless the user explicitly asks.
- Preserve the current Stitch-inspired design.
- Do not add payment gateway unless requested.
- Do not add WhatsApp API unless requested.
- Do not add AI features unless requested.
- Use Supabase as source of truth for real app data.
- Do not use localStorage for real data where Supabase is connected; localStorage remains fallback/mock/session-only support.
- Do not expose service role keys in frontend code.
- Keep RLS secure.
- Create new migration files for database changes.
- Do not edit old applied migrations unless explicitly instructed.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` before handing off code changes.

## Handoff Docs

- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Feature Map](docs/FEATURE_MAP.md)
- [Supabase Context](docs/SUPABASE_CONTEXT.md)
- [Current Status](docs/CURRENT_STATUS.md)
- [Next Tasks](docs/NEXT_TASKS.md)
- [Bugs and Risks](docs/BUGS_AND_RISKS.md)
- [Deployment Notes](docs/DEPLOYMENT_NOTES.md)
- [File Summary](docs/FILE_SUMMARY.md)
- [AI Handoff Prompt](docs/AI_HANDOFF_PROMPT.md)

