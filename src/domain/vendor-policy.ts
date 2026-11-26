import { canAccess, type Entitlement } from "./entitlements";

export type VendorStatus = "draft" | "submitted" | "approved" | "rejected" | "unpublished" | "expired";

export interface VendorListing {
  id: string;
  ownerMemberId: string;
  status: VendorStatus;
  eligibilityExpiresAt?: string;
}

export function canManageVendorListing(
  listing: VendorListing,
  memberId: string | null,
  entitlement: Entitlement | null,
  now = new Date(),
): boolean {
  if (!memberId || listing.ownerMemberId !== memberId) return false;
  return canAccess("vendorApplication", entitlement, now).allowed;
}

export function isPublicVendorListing(listing: VendorListing, now = new Date()): boolean {
  if (listing.status !== "approved") return false;
  if (!listing.eligibilityExpiresAt) return false;
  const expiry = new Date(listing.eligibilityExpiresAt);
  return !Number.isNaN(expiry.valueOf()) && expiry.valueOf() > now.valueOf();
}

export function nextVendorStatus(listing: VendorListing, now = new Date()): VendorStatus {
  return isPublicVendorListing(listing, now) ? listing.status : "expired";
}
