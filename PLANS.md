# CRE Alexa membership platform

Keep the existing Astro, Tailwind and Wix integrations. The community uses its own Supabase identity and PostgreSQL authorization. Stripe test billing applies only to community memberships and vendor listings. Existing Wix accounts and orders require a deliberate migration before they can grant community access.

| Phase | Acceptance criteria | Progress |
| --- | --- | --- |
| Repository baseline | Audit routes, existing Wix identity, billing, and permissions | Inspected |
| Database and identity | Apply migration in development, verify OTP, ownership and administrator MFA | Schema and sample data deployed to the isolated CRE Alexa Staging Supabase project. Hosted OTP depends on custom SMTP. |
| Billing and directory | Confirm Stripe lifecycle, publication rules and vendor moderation end to end | Checkout, portal, webhook and moderation code added. Sandbox transactions still need verification. |
| Member and public pages | Validate editable profiles, private files, gated content, event capacity and venue navigation | Routes added. Full browser and service integration coverage is open. |
| Operations | Configure staging, verify service integrations and review deployment | Deployment instructions written. No production deployment authorized. |

Existing Wix routes stay in service. No client data, administrator credentials, live Stripe keys or fabricated parking data are included.
