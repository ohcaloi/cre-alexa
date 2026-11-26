import { canAccess } from "./entitlements";
import { isPublicVendorListing } from "./vendor-policy";

const now = new Date("2026-11-26T00:00:00.000Z");
function equal<T>(actual: T, expected: T): void {
  if (actual !== expected) throw new Error(`Expected ${String(expected)} but received ${String(actual)}`);
}

equal(canAccess("premiumEvent", null, now).allowed, false);
equal(canAccess("premiumEvent", { tier: "standard", status: "active" }, now).allowed, false);
equal(canAccess("premiumEvent", { tier: "premium", status: "active" }, now).allowed, true);
equal(canAccess("vendorApplication", { tier: "premium", status: "refunded" }, now).allowed, false);
equal(isPublicVendorListing({ id: "1", ownerMemberId: "m", status: "approved", eligibilityExpiresAt: "2026-11-25T23:59:59.000Z" }, now), false);
