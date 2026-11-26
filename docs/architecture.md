# CRE Alexa Platform Architecture

## Product model

CRE Alexa is a professional association platform for commercial real estate members, partners, sponsors, and event attendees. The existing application is a Wix Managed Headless Astro site. It remains the single frontend and its supplied site ID remains the source for Wix business data.

Primary public actions are joining a membership plan, discovering an event, applying for a vendor listing, and contacting the team. A signed-in member can manage their profile, membership, vendor application, and account security.

## System boundaries

| Concern | System of record | Trust boundary |
| --- | --- | --- |
| Identity, password, verification, sessions | Wix Members | Wix managed authentication routes and server session cookies |
| Membership plans, orders, renewals | Wix Pricing Plans and Wix eCommerce | Wix checkout and backend entitlement verification |
| Events and registration history | Wix Events & Tickets | Wix event service and server eligibility checks |
| Public vendor, sponsor, and venue content | Wix CMS | Public reads only for approved and published records |
| Applications, approvals, entitlement snapshots | Wix CMS and server workflows | Admin-only writes, never browser authority |
| Résumés and logos | Wix Media private or permission-scoped assets | Signed or authorized download URLs only |
| Card payment methods and tokens | Wix-compatible payment provider | Provider-managed tokenization only |

## Application structure

```text
src/
  pages/                 Astro routes and server-rendered public shells
  components/            React islands for authenticated and transactional controls
  wix/                   Official Wix SDK seams and solution modules
  domain/                Pure entitlement, validation, and policy rules
  server/                Narrow server-only authorization and workflow handlers
  styles/                Shared design tokens and responsive presentation
docs/                    Architecture, operations, security, and deployment guidance
```

## Data flow

1. Public pages render approved CMS records and Wix-owned business data.
2. A member signs in through Wix Members. The managed Astro integration writes the session server-side.
3. A dashboard request reaches a server-only guard. The guard resolves the current member and current Pricing Plans entitlement.
4. The server checks ownership, role, status, and expiry before it returns restricted data or accepts an action.
5. A payment, refund, cancellation, or membership event updates the derived entitlement record idempotently. The payment provider remains the card-data boundary.
6. Public listings only display records that are both approved and published. Expired eligibility suppresses publication.

## CMS collections

Collection names below are implementation identifiers. Fields marked private are never returned by public listing queries.

| Collection | Purpose | Read access | Write access |
| --- | --- | --- | --- |
| `memberProfiles` | Professional and company profile extensions | Owner and admin | Owner through validated server action, admin |
| `vendorListings` | Public approved vendor directory records | Anyone for approved records | Owner draft fields through server action, admin approval |
| `vendorApplications` | Intake, review, payment linkage, audit status | Owner and admin | Owner submit, admin review |
| `sponsorProfiles` | Approved public sponsor pages | Anyone for approved records | Sponsor owner through server action, admin approval |
| `venues` | Reusable venue records | Anyone for published records | Admin |
| `parkingFacilities` | Venue parking references and provider adapter metadata | Anyone for public fields | Admin |
| `entitlementSnapshots` | Derived access state with idempotency keys | No public access | Server workflow and admin |
| `notificationLog` | Delivery and retry audit records | No public access | Server workflow and admin |

Required shared fields are `slug`, `status`, `ownerMemberId`, `createdAt`, `updatedAt`, `approvedAt`, and `eligibilityExpiresAt` where applicable. Public collections never expose private contact, payment, or review fields.

## Membership tiers

| Tier | Public events | Premium events and news | Restricted directory | Vendor application | Sponsor dashboard |
| --- | --- | --- | --- | --- | --- |
| Visitor | Browse | No | No | No | No |
| Standard Member | Yes | No | No | Eligible | No |
| Premium Member | Yes | Yes | Yes | Eligible | No |
| Sponsor Member | Yes | Configurable | Configurable | Configurable | Yes |
| Administrator | Manage | Manage | Manage | Manage | Manage |

Pricing Plans assigns the membership tier. Sponsor capabilities remain configurable through a server-owned policy record, so a plan label alone never authorizes access.

## Implementation phases

1. Foundation and identity
   Add Wix Members, authentication surfaces, session-aware navigation, baseline server guards, and private file policy.
2. Membership and entitlements
   Configure Standard, Premium, and Sponsor plans. Add membership state, purchase, renewal, cancellation, and entitlement projection.
3. Directory and sponsor workflows
   Add CMS schema, applications, approval queue, public search, pagination, owner management, expiry handling, and notifications.
4. Events and venues
   Add public and premium event routes, protected registration checks, venue pages, parking adapter contract, and history.
5. Member and administrator operations
   Build the member dashboard plus admin workflow links to native Wix management surfaces.
6. Verification and release
   Run type checks, access-control tests, expired/refunded payment cases, responsive QA, and a staging verification. A production release requires separate approval.

## Platform limitations and decisions

- The current site does not have Wix Members or Wix CMS installed. Those products must be added before identity or directory functionality can be made live.
- Wix checkout owns payment collection. The site never handles raw card numbers or CVV values.
- Live parking occupancy requires an authorized provider contract and credentials. Until then the UI must show availability as unknown.
- Wix native administration is used for plans, orders, events, and core member operations. The custom administration layer is limited to workflow-specific queues and status views.
- The current Wix regional settings show Philippine currency. The required USD vendor listing price and any US tax configuration need an explicit Wix business-region update before checkout configuration.
