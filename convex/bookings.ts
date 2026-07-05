// Booking confirmation, listing, and cancellation with waitlist promotion.
// sourceRef: docs/hackathon/API_CONTRACT.md (endpoints 13-15) and BUILD_PLAN.md
// (E4-E6).

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireSession } from "./lib/sessions";
import { hasSlotConflict } from "./lib/overlap";
import { generateBookingReference } from "./lib/ids";
import { CANCEL_CUTOFF_HOURS, MS_PER_HOUR, MS_PER_SECOND } from "./lib/rules";

const MAX_REFERENCE_ATTEMPTS = 8;

function toPublicBooking(booking: Doc<"bookings">) {
  return {
    id: booking._id,
    reference: booking.reference,
    studioId: booking.studioId,
    startTs: booking.startTs,
    endTs: booking.endTs,
    status: booking.status,
    priceCents: booking.priceCents,
  };
}

// Confirm a hold into a booking. Idempotent: confirming an already-converted
// hold returns the same booking, never a duplicate.
export const confirm = mutation({
  args: { sessionToken: v.string(), holdId: v.id("holds") },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };

    const hold = await ctx.db.get(args.holdId);
    if (hold === null) return { ok: false as const, reason: "not_found" as const };
    if (hold.userId !== session.userId) return { ok: false as const, reason: "forbidden" as const };

    if (hold.status === "converted") {
      const existing = await ctx.db
        .query("bookings")
        .withIndex("by_hold", (index) => index.eq("holdId", hold._id))
        .unique();
      if (existing !== null) {
        return { ok: true as const, existing: true as const, booking: toPublicBooking(existing) };
      }
      return { ok: false as const, reason: "not_found" as const };
    }

    const now = Date.now();
    if (hold.status !== "active" || hold.expiresAt <= now) {
      if (hold.status === "active") {
        await ctx.db.patch(hold._id, { status: "expired" }); // lazy expiry
      }
      return { ok: false as const, reason: "hold_expired" as const };
    }

    // Defensive re-check (the hold itself is excluded); the slot should be clear.
    if (await hasSlotConflict(ctx, hold.studioId, hold.startTs, hold.endTs, now, hold._id)) {
      return { ok: false as const, reason: "slot_conflict" as const };
    }

    const studio = await ctx.db.get(hold.studioId);
    if (studio === null) return { ok: false as const, reason: "not_found" as const };

    let reference = generateBookingReference();
    let attempts = 0;
    while (
      (await ctx.db
        .query("bookings")
        .withIndex("by_reference", (index) => index.eq("reference", reference))
        .unique()) !== null
    ) {
      reference = generateBookingReference();
      attempts += 1;
      if (attempts >= MAX_REFERENCE_ATTEMPTS) {
        return { ok: false as const, reason: "validation" as const };
      }
    }

    const bookingId = await ctx.db.insert("bookings", {
      studioId: hold.studioId,
      userId: session.userId,
      startTs: hold.startTs,
      endTs: hold.endTs,
      status: "confirmed",
      reference,
      holdId: hold._id,
      priceCents: studio.hourlyPriceCents,
    });
    await ctx.db.patch(hold._id, { status: "converted" });
    const created = await ctx.db.get(bookingId);
    if (created === null) return { ok: false as const, reason: "validation" as const };
    return { ok: true as const, existing: false as const, booking: toPublicBooking(created) };
  },
});

export const list = query({
  args: { sessionToken: v.string(), all: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };
    if (args.all === true) {
      if (session.role !== "admin") return { ok: false as const, reason: "forbidden" as const };
      const all = await ctx.db.query("bookings").collect();
      return { ok: true as const, bookings: all.map(toPublicBooking) };
    }
    const own = await ctx.db
      .query("bookings")
      .withIndex("by_user", (index) => index.eq("userId", session.userId))
      .collect();
    return { ok: true as const, bookings: own.map(toPublicBooking) };
  },
});

// Cancel a booking, then promote the oldest waiting waitlist entry for the exact
// slot into a fresh active hold (if the slot is otherwise free).
export const cancel = mutation({
  args: { sessionToken: v.string(), bookingId: v.id("bookings"), ttlSeconds: v.number() },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };

    const booking = await ctx.db.get(args.bookingId);
    if (booking === null) return { ok: false as const, reason: "not_found" as const };

    const isOwner = booking.userId === session.userId;
    const isAdmin = session.role === "admin";
    if (!isOwner && !isAdmin) return { ok: false as const, reason: "forbidden" as const };

    if (booking.status === "cancelled") {
      return { ok: true as const, promoted: false as const };
    }

    const now = Date.now();
    // Members are bound by the cancellation cutoff; admins bypass it.
    if (!isAdmin && now > booking.startTs - CANCEL_CUTOFF_HOURS * MS_PER_HOUR) {
      return { ok: false as const, reason: "outside_cancel_window" as const };
    }

    await ctx.db.patch(args.bookingId, { status: "cancelled", cancelledAt: now });

    const waiting = await ctx.db
      .query("waitlist")
      .withIndex("by_studio_slot", (index) =>
        index.eq("studioId", booking.studioId).eq("startTs", booking.startTs),
      )
      .collect();
    const oldestWaiting = waiting
      .filter((entry) => entry.status === "waiting")
      .sort((left, right) => left._creationTime - right._creationTime)[0];

    if (oldestWaiting === undefined) {
      return { ok: true as const, promoted: false as const };
    }
    // Only promote if the slot is genuinely free now (a blackout could cover it).
    if (await hasSlotConflict(ctx, booking.studioId, booking.startTs, booking.endTs, now)) {
      return { ok: true as const, promoted: false as const };
    }

    const promotedHoldId = await ctx.db.insert("holds", {
      studioId: booking.studioId,
      userId: oldestWaiting.userId,
      startTs: booking.startTs,
      endTs: booking.endTs,
      status: "active",
      expiresAt: now + args.ttlSeconds * MS_PER_SECOND,
    });
    await ctx.db.patch(oldestWaiting._id, { status: "promoted" });
    return { ok: true as const, promoted: true as const, promotedHoldId };
  },
});
