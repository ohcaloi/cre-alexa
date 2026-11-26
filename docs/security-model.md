# CRE Alexa Security Model

## Authorization rules

- Resolve the Wix session server-side for every restricted route and mutation.
- Derive plan status from Wix Pricing Plans or an idempotent server-owned entitlement projection.
- Verify an owner relationship before reading or editing a member, vendor, sponsor, résumé, or application record.
- Use an explicit role allowlist for administrator operations. Do not infer administration from client input or a URL parameter.
- Query public CMS collections with approval and publication predicates. Never rely on a hidden UI route.

## Data protection

- Store résumé files in private or permission-scoped media storage. Issue a short-lived authorized download URL only after an ownership or administrator check.
- Keep payment collection in Wix checkout and its configured provider. Do not collect raw card details, CVV values, payment tokens, or provider secrets in CMS or frontend code.
- Keep secrets in Wix or deployment environment configuration. `.env.local` remains ignored by Git.
- Log workflow outcomes with correlation and idempotency keys, never passwords, OTP values, card data, or private document URLs.

## Input and workflow protection

- Validate request shape, file type, file size, text length, URL scheme, and enum values in a server-only handler.
- Sanitize rich text before publishing. Render only approved rich text from the controlled CMS pipeline.
- Rate limit login-adjacent, application, contact, and notification-trigger actions.
- Require a unique external event identifier before applying payment or refund side effects. Replays must return the prior outcome.
- Treat refunded, canceled, expired, and unpaid states as ineligible until a fresh verified entitlement exists.

## Security test cases

- Anonymous users cannot retrieve premium content through a direct URL or API request.
- Standard members cannot register for a premium event.
- A member cannot read or update another member's vendor draft or résumé.
- A browser cannot set `approved`, `published`, `ownerMemberId`, or entitlement fields.
- An expired or refunded vendor entitlement unpublishes the directory entry.
- Replayed payment event processing does not create duplicate entitlements or notifications.
