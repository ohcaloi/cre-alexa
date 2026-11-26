# Community deployment

The Astro application keeps the established Wix routes. Supabase and Stripe own the separate community area. Existing Wix member, plan and event records do not automatically become community records. Reconcile identities, subscriptions and public content before migrating any live users.

The isolated Supabase project **CRE Alexa Staging** uses project reference `ocuahdnxckjslbhrqxdt`. Its community migrations and development fixtures are applied. The local preview uses this project's publishable key. Anonymous Data API verification confirmed the plans and sample venues are visible, the sample premium article is hidden, and the profiles table denies anonymous access. The security advisor reports the explicitly exposed, access-checked community RPCs and the deliberately inaccessible webhook ledger.

## Development configuration

For staging, keep the provider settings in an ignored `.env.staging.local` while preparing them and run `npm run staging:preflight`. This check validates the settings without sending requests or printing their values. Supply the same values through the staging host's server secret settings when deploying. Confirm the Supabase project reference is separate from production before running migrations, then use the sample data only in that isolated project.

1. Create a development Supabase project with email authentication and TOTP enabled. Use a sender on a domain verified with the SMTP provider, and use a dedicated SMTP sender in production. Set the site URL to the community origin, set email OTP expiry and resend limits, and configure CAPTCHA or an equivalent edge control where needed. In Supabase Auth, use `supabase/templates/community-email-code.html` as the body for both **Confirm sign up** and **Magic link**, with the subject “Your CRE Alexa sign-in code”. Both templates must include the Supabase token (`{{ .Token }}`) so users can enter a code in the app. Test both first-time registration and repeat sign-in.
2. Apply the migrations in `supabase/migrations` in order against the development project. For Supabase CLI, link only the development project, inspect `supabase migration list`, preview the migration, then apply it. Back up the database and bucket contents before any production change.
3. Add the server variables from `.env.example` to the application runtime. Use `.env.local` for local development. Set `COMMUNITY_ORIGIN` to the exact browser origin without a trailing slash. Keep the publishable and service-role keys distinct. Store the service-role key, Stripe secret and signing secret in the host's secret manager. Verify that the hosting runtime supplies these secrets through Astro's server environment API before release.
4. Use Stripe sandbox prices for Standard, Premium and Sponsor. Set each Price ID using the administrator plan form. Create a **one-time USD 65.00** test price for vendor listings and set `COMMUNITY_VENDOR_PRICE_ID`. Configure the Customer Portal for payment methods, allowed plan changes, cancellations and invoice history. Keep Price IDs mapped while subscriptions using them are active.
5. Add `POST /api/community/webhook` as a Stripe sandbox event endpoint. Subscribe to `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `charge.refunded`. Set the signing secret for that endpoint. Exercise delayed and duplicated deliveries and compare the resulting database records with the Stripe dashboard.
6. Optional Google Maps embed uses a browser-visible key restricted to the Maps Embed API and approved website referrers. Add verified parking facilities through the administrator page. Directions links remain available without a key. Live occupancy is unavailable until a provider is integrated and verified.

## Administrators

Create and verify the first admin through email sign-in. An authorized database operator can insert the verified user's ID into `community_admins` with role `manager`. The administrator then enrolls a TOTP factor at `/community/security`. Administrator writes require an AAL2 session. Use `editor` for content and attendance and `moderator` for paid vendor applications. Never grant administration from user-supplied profile metadata.

## Release checklist

- Verify real OTP provisioning, expiration, rate limits, email deliverability, cancellation, renewal and refund flows in staging.
- Verify the expected policy and role results via the actual Supabase REST and Storage API. Check that Wix routes and SEO continue to work on the deployment host.
- Lock secrets to the server runtime, verify HTTPS and cookie behavior behind the public domain, and restrict the map key and Supabase redirect origins.
- Confirm backups and rehearse restore into a separate project. Record database and application versions and designate a rollback owner.
- Replace the privacy and terms placeholders with approved content. Configure production domain and email DNS only after approval.
- Treat the Stripe implementation as sandbox-only. A production billing rollout needs a separate code and operations review.

Unverified or remaining work includes live SMTP, complete payment lifecycle verification, subscription refund reconciliation, expanded member administration, notification delivery, real-time parking, and production hosting secrets. Wix publishing and changing production data require separate approval.
