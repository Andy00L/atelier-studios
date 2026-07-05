// Session validation shared by every protected Convex function. Enforcement
// lives here (inside Convex), not in the route handlers, because the deployment
// URL is public and functions must be self-protecting. sourceRef:
// docs/hackathon/BUILD_PLAN.md (C2) and the Convex auth research brief.

import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// sha-256 of the raw bearer token as lowercase hex, via Web Crypto (a global in
// the Convex runtime). Storing only this hash makes a leaked row useless without
// the token preimage.
export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export type SessionResult =
  | { ok: true; userId: Id<"users">; role: "member" | "admin" }
  | { ok: false };

// Resolve a raw bearer token to its user and role, or a failure. Reads only, so
// it accepts a QueryCtx (a MutationCtx satisfies it too).
export async function requireSession(ctx: QueryCtx, rawToken: string): Promise<SessionResult> {
  const tokenHash = await sha256Hex(rawToken);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (index) => index.eq("tokenHash", tokenHash))
    .unique();
  if (session === null) {
    return { ok: false };
  }
  if (session.expiresAt <= Date.now()) {
    return { ok: false };
  }
  const user = await ctx.db.get(session.userId);
  if (user === null) {
    return { ok: false };
  }
  return { ok: true, userId: user._id, role: user.role };
}
