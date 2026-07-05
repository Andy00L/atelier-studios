// Waitlist join/list/cancel. A slot is waitlist-eligible only when a confirmed
// booking overlaps it (a free slot should be booked, not waited on). sourceRef:
// docs/hackathon/API_CONTRACT.md (endpoints 16-18).

import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { requireSession } from "./lib/sessions";
import { checkSlotAlignment } from "./lib/time";

// True when a confirmed booking overlaps the slot (the slot is genuinely full).
async function slotHasConfirmedBooking(
  ctx: QueryCtx,
  studioId: Id<"studios">,
  startTs: number,
  endTs: number,
): Promise<boolean> {
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("by_studio_start", (index) => index.eq("studioId", studioId).lt("startTs", endTs))
    .collect();
  return bookings.some(
    (booking) => booking.status === "confirmed" && booking.endTs > startTs,
  );
}

// Rank (1-based) of an entry among the waiting entries for its slot, oldest first.
function positionOf(entry: Doc<"waitlist">, slotWaiting: ReadonlyArray<Doc<"waitlist">>): number {
  const ordered = slotWaiting
    .filter((candidate) => candidate.status === "waiting")
    .sort((left, right) => left._creationTime - right._creationTime);
  return ordered.findIndex((candidate) => candidate._id === entry._id) + 1;
}

export const join = mutation({
  args: { sessionToken: v.string(), studioId: v.id("studios"), startTs: v.number(), endTs: v.number() },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };
    const alignment = checkSlotAlignment(args.startTs, args.endTs);
    if (!alignment.ok) return { ok: false as const, reason: "validation" as const };
    const studio = await ctx.db.get(args.studioId);
    if (studio === null || !studio.active) return { ok: false as const, reason: "not_found" as const };

    if (!(await slotHasConfirmedBooking(ctx, args.studioId, args.startTs, args.endTs))) {
      return { ok: false as const, reason: "slot_not_full" as const };
    }

    const slotWaiting = await ctx.db
      .query("waitlist")
      .withIndex("by_studio_slot", (index) =>
        index.eq("studioId", args.studioId).eq("startTs", args.startTs),
      )
      .collect();
    const alreadyWaiting = slotWaiting.some(
      (entry) => entry.userId === session.userId && entry.status === "waiting",
    );
    if (alreadyWaiting) return { ok: false as const, reason: "already_waitlisted" as const };

    const waitingCount = slotWaiting.filter((entry) => entry.status === "waiting").length;
    const entryId = await ctx.db.insert("waitlist", {
      studioId: args.studioId,
      userId: session.userId,
      startTs: args.startTs,
      endTs: args.endTs,
      status: "waiting",
    });
    return { ok: true as const, id: entryId, position: waitingCount + 1 };
  },
});

export const listMine = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };
    const mine = await ctx.db
      .query("waitlist")
      .withIndex("by_user", (index) => index.eq("userId", session.userId))
      .collect();
    const waitingMine = mine.filter((entry) => entry.status === "waiting");

    const entries = [];
    for (const entry of waitingMine) {
      const slotWaiting = await ctx.db
        .query("waitlist")
        .withIndex("by_studio_slot", (index) =>
          index.eq("studioId", entry.studioId).eq("startTs", entry.startTs),
        )
        .collect();
      entries.push({
        id: entry._id,
        studioId: entry.studioId,
        startTs: entry.startTs,
        endTs: entry.endTs,
        position: positionOf(entry, slotWaiting),
      });
    }
    return { ok: true as const, entries };
  },
});

export const cancel = mutation({
  args: { sessionToken: v.string(), waitlistId: v.id("waitlist") },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };
    const entry = await ctx.db.get(args.waitlistId);
    if (entry === null) return { ok: false as const, reason: "not_found" as const };
    if (entry.userId !== session.userId) return { ok: false as const, reason: "forbidden" as const };
    if (entry.status === "waiting") {
      await ctx.db.patch(args.waitlistId, { status: "cancelled" });
    }
    return { ok: true as const };
  },
});
