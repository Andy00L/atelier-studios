// Convex data model for Atelier. sourceRef: docs/hackathon/BUILD_PLAN.md (C1)
// and docs/hackathon/API_CONTRACT.md. Convex adds _id and _creationTime to every
// document automatically. Indexes exist for every lookup the functions perform.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Accounts. passwordHash is the scrypt-encoded string from src/lib/passwords.ts;
  // the plaintext never reaches Convex.
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.union(v.literal("member"), v.literal("admin")),
  }).index("by_email", ["email"]),

  // Bearer-token sessions. tokenHash is sha-256 of the raw token, computed inside
  // Convex, so a leaked tokenHash cannot be replayed without the preimage.
  sessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(),
  }).index("by_tokenHash", ["tokenHash"]),

  studios: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    equipment: v.array(v.string()),
    hourlyPriceCents: v.number(),
    photoUrl: v.string(),
    openHour: v.number(), // UTC hour 0..23, inclusive
    closeHour: v.number(), // UTC hour 1..24, exclusive end of the last bookable slot
    active: v.boolean(),
  }).index("by_slug", ["slug"]),

  // Short-lived reservations. Lazy expiry: a hold with expiresAt <= now is treated
  // as dead everywhere it is read, regardless of status.
  holds: defineTable({
    studioId: v.id("studios"),
    userId: v.id("users"),
    startTs: v.number(),
    endTs: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("converted"),
      v.literal("released"),
    ),
    expiresAt: v.number(),
  })
    .index("by_studio_start", ["studioId", "startTs"])
    .index("by_user", ["userId"]),

  bookings: defineTable({
    studioId: v.id("studios"),
    userId: v.id("users"),
    startTs: v.number(),
    endTs: v.number(),
    status: v.union(v.literal("confirmed"), v.literal("cancelled")),
    reference: v.string(),
    holdId: v.id("holds"),
    priceCents: v.number(),
    cancelledAt: v.optional(v.number()),
  })
    .index("by_studio_start", ["studioId", "startTs"])
    .index("by_user", ["userId"])
    .index("by_hold", ["holdId"])
    .index("by_reference", ["reference"]),

  waitlist: defineTable({
    studioId: v.id("studios"),
    userId: v.id("users"),
    startTs: v.number(),
    endTs: v.number(),
    status: v.union(v.literal("waiting"), v.literal("promoted"), v.literal("cancelled")),
  })
    .index("by_studio_slot", ["studioId", "startTs"])
    .index("by_user", ["userId"]),

  blackouts: defineTable({
    studioId: v.id("studios"),
    startTs: v.number(),
    endTs: v.number(),
    reason: v.string(),
  }).index("by_studio_start", ["studioId", "startTs"]),
});
