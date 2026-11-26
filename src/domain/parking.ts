export type ParkingAvailability = "available" | "limited" | "full" | "unknown";

export interface ParkingSnapshot {
  availability: ParkingAvailability;
  observedAt: string | null;
  source: "provider" | "unavailable";
}

/**
 * The parking adapter intentionally fails closed. A future provider integration may return a
 * verified normalized snapshot, but an absent key or a provider failure must never imply space.
 */
export function unavailableParking(): ParkingSnapshot {
  return { availability: "unknown", observedAt: null, source: "unavailable" };
}
