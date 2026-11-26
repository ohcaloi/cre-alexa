# Community data

This schema is separate from the earlier Wix CMS proposal in [architecture](architecture.md). The implementation and acceptance criteria are in [PLANS.md](../PLANS.md).

| Records | Control |
| --- | --- |
| `community_profiles` | Private per verified user. Profile owner can create and edit. |
| `community_admins` | Operator-managed roles. Database functions require AAL2 for privileged work. |
| `community_plans`, `community_memberships` | Available plan catalog and service-written subscription projection. Active status, expiry and numeric plan level determine access. |
| `community_records`, `community_parking` | Events, articles, venues and sponsors with published status and minimum membership level. Venue ordering uses display order then slug. |
| `community_registrations` | Per-event and per-user unique registration. Registration locks the event before checking capacity. |
| `community_vendor_applications` | Member-owned intake. Payment and moderator approval are separate. The public projection excludes owner identifiers and expired, unpaid or inactive applications. |
| `community_payments`, `community_webhook_events` | Stripe identifiers, amounts and statuses. Stripe event keys deduplicate writes in the database transaction. |
| `community_audit` | Vendor moderation record with authenticated actor, target and timestamp. |
| `community-avatars`, `community-resumes` | Private Storage buckets. The server validates uploads before writing to the verified user's prefix. Direct member writes are denied. Download URLs last 60 seconds. |

Database tests insert their own fixture data into an ephemeral PostgreSQL instance. Three plan definitions are included in the migration. Live prices, vendor listings and member records are supplied separately.
