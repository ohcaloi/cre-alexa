# CRE Alexa Implementation Plan

## Current baseline

The site is a Wix Managed Headless Astro project. It already uses Wix Events, Bookings, Blog, Stores, Forms, Pricing Plans, and Table Reservations. It does not currently include Wix Members or Wix CMS.

## Dependency requirements

- Wix Members Area for member registration, login, verification, password recovery, session management, and profile identity.
- Wix CMS for vendor, sponsor, venue, parking, notification, and entitlement workflow records.
- Wix Pricing Plans for Standard, Premium, and Sponsor plans.
- Wix Events and Tickets for event records and registration.
- Wix eCommerce and Payments for provider-managed checkout.
- An authorized parking data provider only when live occupancy is required.

## Build sequence

1. Add Members and CMS capability to the existing Wix site.
2. Deploy the official members and CMS data layers into the existing Astro source.
3. Create dashboard, login, vendor directory, sponsor, and venue surfaces.
4. Configure plan and CMS schema through documented Wix recipes.
5. Add server-owned approval, entitlement, and notification workflows.
6. Run access, lifecycle, and browser verification.
7. Request production release approval after staging verification.

## Configuration values

Set these outside source control.

```text
WIX_CLIENT_ID=
PARKING_PROVIDER_BASE_URL=
PARKING_PROVIDER_API_KEY=
PARKING_PROVIDER_TIMEOUT_MS=5000
WORKFLOW_SIGNING_SECRET=
```

`PARKING_PROVIDER_*` stays unset until CRE Alexa has an authorized live occupancy provider. The adapter reports `unknown` without these values.
