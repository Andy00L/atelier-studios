// Hold creation and release. A hold is a short-lived claim on a slot; lazy
// expiry (expiresAt) is authoritative. sourceRef: docs/hackathon/API_CONTRACT.md
// (endpoints 11-12) and BUILD_PLAN.md (E3).

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireSession } from "./lib/sessions";
import { hasSlotConflict } from "./lib/overlap";
import { checkSlotAlignment, utcHourOf } from "./lib/time";
import { BOOKING_HORIZON_DAYS, MS_PER_DAY, MS_PER_SECOND } from "./lib/rules";

function toPublicHold(hold: Doc<"holds">) {
  return {
    id: hold._id,
    studioId: hold.studioId,
    startTs: hold.startTs,
    endTs: hold.endTs,
    expiresAt: hold.expiresAt,
    status: hold.status,
  };
}

export const create = mutation({
  args: {
    sessionToken: v.string(),
    studioId: v.id("studios"),
    startTs: v.number(),
    endTs: v.number(),
    ttlSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };

    const alignment = checkSlotAlignment(args.startTs, args.endTs);
    if (!alignment.ok) return { ok: false as const, reason: "validation" as const };

    const studio = await ctx.db.get(args.studioId);
    if (studio === null || !studio.active) return { ok: false as const, reason: "not_found" as const };

    const now = Date.now();
    if (args.startTs < now) return { ok: false as const, reason: "slot_in_past" as const };
    if (args.startTs > now + BOOKING_HORIZON_DAYS * MS_PER_DAY) {
      return { ok: false as const, reason: "beyond_horizon" as const };
    }
    const hour = utcHourOf(args.startTs);
    if (hour < studio.openHour || hour >= studio.closeHour) {
      return { ok: false as const, reason: "outside_open_hours" as const };
    }

    // Idempotent: the same user re-requesting a slot they already actively hold
    // gets that hold back instead of a conflict.
    const sameSlotHolds = await ctx.db
      .query("holds")
      .withIndex("by_studio_start", (index) =>
        index.eq("studioId", args.studioId).eq("startTs", args.startTs),
      )
      .collect();
    const ownedActive = sameSlotHolds.find(
      (hold) =>
        hold.userId === session.userId && hold.status === "active" && hold.expiresAt > now,
    );
    if (ownedActive !== undefined) {
      return { ok: true as const, existing: true as const, hold: toPublicHold(ownedActive) };
    }

    if (await hasSlotConflict(ctx, args.studioId, args.startTs, args.endTs, now)) {
      return { ok: false as const, reason: "slot_conflict" as const };
    }

    const holdId = await ctx.db.insert("holds", {
      studioId: args.studioId,
      userId: session.userId,
      startTs: args.startTs,
      endTs: args.endTs,
      status: "active",
      expiresAt: now + args.ttlSeconds * MS_PER_SECOND,
    });
    const created = await ctx.db.get(holdId);
    if (created === null) return { ok: false as const, reason: "validation" as const };
    return { ok: true as const, existing: false as const, hold: toPublicHold(created) };
  },
});

export const release = mutation({
  args: { sessionToken: v.string(), holdId: v.id("holds") },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };
    const hold = await ctx.db.get(args.holdId);
    if (hold === null) return { ok: false as const, reason: "not_found" as const };
    if (hold.userId !== session.userId) return { ok: false as const, reason: "forbidden" as const };
    if (hold.status === "active") {
      await ctx.db.patch(args.holdId, { status: "released" });
    }
    return { ok: true as const };
  },
});
