// The anti-double-booking core. Given a studio and a half-open interval
// [startTs, endTs), reports whether any active non-expired hold, confirmed
// booking, or blackout overlaps it. Called inside a single mutation, so the
// serializable transaction makes check-then-insert race-free. sourceRef:
// docs/hackathon/BUILD_PLAN.md (C3) and API_CONTRACT.md (Invariant).

import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Two half-open intervals overlap when each starts before the other ends. The
// index bounds start < endTs; this residual check adds end > startTs.
function overlaps(existingStart: number, existingEnd: number, startTs: number, endTs: number): boolean {
  return existingStart < endTs && existingEnd > startTs;
}

// When excludeHoldId is set, that hold is ignored (used at confirm time so a
// hold does not conflict with itself).
export async function hasSlotConflict(
  ctx: QueryCtx,
  studioId: Id<"studios">,
  startTs: number,
  endTs: number,
  now: number,
  excludeHoldId?: Id<"holds">,
): Promise<boolean> {
  const candidateHolds = await ctx.db
    .query("holds")
    .withIndex("by_studio_start", (index) => index.eq("studioId", studioId).lt("startTs", endTs))
    .collect();
  for (const hold of candidateHolds) {
    if (excludeHoldId !== undefined && hold._id === excludeHoldId) continue;
    if (hold.status !== "active") continue;
    if (hold.expiresAt <= now) continue; // lazy expiry: an expired hold frees the slot
    if (overlaps(hold.startTs, hold.endTs, startTs, endTs)) return true;
  }

  const candidateBookings = await ctx.db
    .query("bookings")
    .withIndex("by_studio_start", (index) => index.eq("studioId", studioId).lt("startTs", endTs))
    .collect();
  for (const booking of candidateBookings) {
    if (booking.status !== "confirmed") continue;
    if (overlaps(booking.startTs, booking.endTs, startTs, endTs)) return true;
  }

  const candidateBlackouts = await ctx.db
    .query("blackouts")
    .withIndex("by_studio_start", (index) => index.eq("studioId", studioId).lt("startTs", endTs))
    .collect();
  for (const blackout of candidateBlackouts) {
    if (overlaps(blackout.startTs, blackout.endTs, startTs, endTs)) return true;
  }

  return false;
}
