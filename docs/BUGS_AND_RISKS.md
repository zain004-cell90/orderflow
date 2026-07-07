# Bugs and Risks

## Technical Risks

- Supabase migrations may not all be applied in a new environment.
- RLS may block valid requests if policies miss a table or relationship.
- Public checkout RPC may fail if payload shape changes.
- Env vars may be missing or wrong in local/Vercel.
- Auth redirect URLs may still point to localhost if Supabase dashboard is not configured.
- Storage policies may fail logo/product image uploads.
- Plan limits need boundary testing at Free/Starter/Growth limits.
- Admin access may require manual database role assignment for non-default admins.
- Public checkout by `store-id` fallback may not show products if no real active products exist for that slug.

## Product Risks

- Sellers may not understand the checkout link concept quickly.
- Onboarding friction may block first-time setup.
- Pricing may need real-market validation.
- Sellers may ask for WhatsApp notifications.
- Manual COD workflow may need courier/status changes for real operations.
- Customers may expect online payment, which is not MVP scope.

## Security Risks

- Service role key must never be exposed in frontend code.
- Public checkout must not expose private seller/customer data.
- Admin route must check database role, not only frontend state.
- CSV export must continue protecting against spreadsheet formula injection.
- Contact submissions must remain public insert only and admin read/update/delete only.
- RLS policies should be reviewed after every schema change.

