export type MembershipTier = "visitor" | "standard" | "premium" | "sponsor" | "administrator";
export type EntitlementStatus = "active" | "pending" | "expired" | "canceled" | "refunded";
export type ProtectedCapability =
  | "premiumContent"
  | "premiumEvent"
  | "restrictedDirectory"
  | "vendorApplication"
  | "sponsorDashboard"
  | "admin";

export interface Entitlement {
  tier: MembershipTier;
  status: EntitlementStatus;
  expiresAt?: string;
  sponsorCapabilities?: readonly ProtectedCapability[];
}

export interface AccessDecision {
  allowed: boolean;
  reason:
    | "allowed"
    | "authentication_required"
    | "membership_inactive"
    | "membership_expired"
    | "capability_not_included";
}

function isPast(iso: string | undefined, now: Date): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  return !Number.isNaN(date.valueOf()) && date.valueOf() <= now.valueOf();
}

export function isActive(entitlement: Entitlement | null, now = new Date()): boolean {
  if (!entitlement) return false;
  return entitlement.status === "active" && !isPast(entitlement.expiresAt, now);
}

export function canAccess(
  capability: ProtectedCapability,
  entitlement: Entitlement | null,
  now = new Date(),
): AccessDecision {
  if (!entitlement || entitlement.tier === "visitor") {
    return { allowed: false, reason: "authentication_required" };
  }
  if (entitlement.status !== "active") {
    return { allowed: false, reason: "membership_inactive" };
  }
  if (isPast(entitlement.expiresAt, now)) {
    return { allowed: false, reason: "membership_expired" };
  }
  if (entitlement.tier === "administrator") return { allowed: true, reason: "allowed" };
  const grants = entitlement.tier === "standard"
    ? ["vendorApplication"]
    : entitlement.tier === "premium"
      ? ["premiumContent", "premiumEvent", "restrictedDirectory", "vendorApplication"]
      : entitlement.sponsorCapabilities ?? ["vendorApplication", "sponsorDashboard"];

  return grants.includes(capability)
    ? { allowed: true, reason: "allowed" }
    : { allowed: false, reason: "capability_not_included" };
}
