// Internal maintenance. expireDueHolds forces lazy expiry so TTL behavior is
// testable without waiting on wall-clock time. The route handler guards this
// with a shared key; the mutation itself is harmless (it only marks already-due
// holds as expired). sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 22).

import { mutation } from "./_generated/server";

export const expireDueHolds = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Full scan: acceptable at hackathon scale. An index on expiresAt would be
    // the production optimization.
    const holds = await ctx.db.query("holds").collect();
    let expired = 0;
    for (const hold of holds) {
      if (hold.status === "active" && hold.expiresAt <= now) {
        await ctx.db.patch(hold._id, { status: "expired" });
        expired += 1;
      }
    }
    return { ok: true as const, expired };
  },
});
