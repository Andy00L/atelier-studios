// Session lifecycle. The raw token is generated in the Node login route and
// passed here; Convex hashes it (sha-256) and stores only the hash plus an
// expiry. sourceRef: docs/hackathon/BUILD_PLAN.md (D), API_CONTRACT.md (Auth).

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { sha256Hex } from "./lib/sessions";
import { MS_PER_SECOND } from "./lib/rules";

// Create a session for a user from a raw token and a TTL in seconds. Returns the
// expiry so the caller can surface it if needed.
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    rawToken: v.string(),
    ttlSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.rawToken);
    const expiresAt = Date.now() + args.ttlSeconds * MS_PER_SECOND;
    await ctx.db.insert("sessions", {
      userId: args.userId,
      tokenHash,
      expiresAt,
    });
    return { ok: true as const, expiresAt };
  },
});

// Invalidate a session by its raw token. Idempotent: deleting an unknown token
// still returns ok (logout is never an error).
export const destroySession = mutation({
  args: { rawToken: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.rawToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (index) => index.eq("tokenHash", tokenHash))
      .unique();
    if (session !== null) {
      await ctx.db.delete(session._id);
    }
    return { ok: true as const };
  },
});
