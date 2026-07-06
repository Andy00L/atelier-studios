// Availability grid for a studio over a bounded window. sourceRef:
// docs/hackathon/API_CONTRACT.md (endpoint 10).

import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  AVAILABILITY_RANGE_MAX_DAYS,
  BOOKING_HORIZON_DAYS,
  MS_PER_DAY,
  MS_PER_MINUTE,
  SLOT_MINUTES,
} from "./lib/rules";
import { utcHourOf } from "./lib/time";

type SlotStatus = "free" | "held" | "booked" | "blackout" | "past";

export const getForStudio = query({
  args: { studioId: v.id("studios"), from: v.number(), to: v.number() },
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.from) || !Number.isInteger(args.to) || args.from >= args.to) {
      return { ok: false as const, reason: "validation" as const };
    }
    if (args.to - args.from > AVAILABILITY_RANGE_MAX_DAYS * MS_PER_DAY) {
      return { ok: false as const, reason: "validation" as const };
    }
    const studio = await ctx.db.get(args.studioId);
    if (studio === null || !studio.active) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const now = Date.now();
    const slotMs = SLOT_MINUTES * MS_PER_MINUTE;

    // Pull everything overlapping the window once, then classify slots in memory.
    const holds = (
      await ctx.db
        .query("holds")
        .withIndex("by_studio_start", (index) =>
          index.eq("studioId", args.studioId).lt("startTs", args.to),
        )
        .collect()
    ).filter(
      (hold) => hold.status === "active" && hold.expiresAt > now && hold.endTs > args.from,
    );
    const bookings = (
      await ctx.db
        .query("bookings")
        .withIndex("by_studio_start", (index) =>
          index.eq("studioId", args.studioId).lt("startTs", args.to),
        )
        .collect()
    ).filter((booking) => booking.status === "confirmed" && booking.endTs > args.from);
    const blackouts = (
      await ctx.db
        .query("blackouts")
        .withIndex("by_studio_start", (index) =>
          index.eq("studioId", args.studioId).lt("startTs", args.to),
        )
        .collect()
    ).filter((blackout) => blackout.endTs > args.from);

    const coversSlot = (
      ranges: ReadonlyArray<{ startTs: number; endTs: number }>,
      slotStart: number,
      slotEnd: number,
    ): boolean => ranges.some((range) => range.startTs < slotEnd && range.endTs > slotStart);

    const slots: Array<{ startTs: number; endTs: number; status: SlotStatus }> = [];
    // First aligned slot start at or after `from`.
    const firstStart = Math.ceil(args.from / slotMs) * slotMs;
    for (let slotStart = firstStart; slotStart + slotMs <= args.to; slotStart += slotMs) {
      const slotEnd = slotStart + slotMs;
      const hour = utcHourOf(slotStart);
      if (hour < studio.openHour || hour >= studio.closeHour) {
        continue; // outside the studio's open hours: not a bookable slot
      }
      if (slotStart > now + BOOKING_HORIZON_DAYS * MS_PER_DAY) {
        continue; // beyond the booking horizon: a hold would reject it, so it is not free
      }
      let status: SlotStatus;
      if (slotStart < now) {
        status = "past";
      } else if (coversSlot(blackouts, slotStart, slotEnd)) {
        status = "blackout";
      } else if (coversSlot(bookings, slotStart, slotEnd)) {
        status = "booked";
      } else if (coversSlot(holds, slotStart, slotEnd)) {
        status = "held";
      } else {
        status = "free";
      }
      slots.push({ startTs: slotStart, endTs: slotEnd, status });
    }

    return { ok: true as const, slots };
  },
});
