// Admin blackout windows. Creating a blackout wins over existing reservations:
// overlapping active holds are released and confirmed bookings are cancelled,
// with their waitlist entries discarded. sourceRef:
// docs/hackathon/API_CONTRACT.md (endpoints 19-20).

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireSession } from "./lib/sessions";

function overlaps(existingStart: number, existingEnd: number, startTs: number, endTs: number): boolean {
  return existingStart < endTs && existingEnd > startTs;
}

export const create = mutation({
  args: {
    sessionToken: v.string(),
    studioId: v.id("studios"),
    startTs: v.number(),
    endTs: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };
    if (session.role !== "admin") return { ok: false as const, reason: "forbidden" as const };
    if (!Number.isInteger(args.startTs) || !Number.isInteger(args.endTs) || args.startTs >= args.endTs) {
      return { ok: false as const, reason: "validation" as const };
    }
    const studio = await ctx.db.get(args.studioId);
    if (studio === null) return { ok: false as const, reason: "not_found" as const };

    const now = Date.now();

    const holds = await ctx.db
      .query("holds")
      .withIndex("by_studio_start", (index) => index.eq("studioId", args.studioId).lt("startTs", args.endTs))
      .collect();
    let releasedHolds = 0;
    for (const hold of holds) {
      if (hold.status === "active" && overlaps(hold.startTs, hold.endTs, args.startTs, args.endTs)) {
        await ctx.db.patch(hold._id, { status: "released" });
        releasedHolds += 1;
      }
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_studio_start", (index) => index.eq("studioId", args.studioId).lt("startTs", args.endTs))
      .collect();
    let cancelledBookings = 0;
    for (const booking of bookings) {
      if (booking.status === "confirmed" && overlaps(booking.startTs, booking.endTs, args.startTs, args.endTs)) {
        await ctx.db.patch(booking._id, { status: "cancelled", cancelledAt: now });
        cancelledBookings += 1;
        // Discard waitlist entries for a slot that is now blacked out.
        const slotWaiting = await ctx.db
          .query("waitlist")
          .withIndex("by_studio_slot", (index) =>
            index.eq("studioId", booking.studioId).eq("startTs", booking.startTs),
          )
          .collect();
        for (const entry of slotWaiting) {
          if (entry.status === "waiting") {
            await ctx.db.patch(entry._id, { status: "cancelled" });
          }
        }
      }
    }

    const blackoutId = await ctx.db.insert("blackouts", {
      studioId: args.studioId,
      startTs: args.startTs,
      endTs: args.endTs,
      reason: args.reason,
    });
    return { ok: true as const, id: blackoutId, releasedHolds, cancelledBookings };
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), blackoutId: v.id("blackouts") },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };
    if (session.role !== "admin") return { ok: false as const, reason: "forbidden" as const };
    const blackout = await ctx.db.get(args.blackoutId);
    if (blackout === null) return { ok: false as const, reason: "not_found" as const };
    await ctx.db.delete(args.blackoutId);
    return { ok: true as const };
  },
});
