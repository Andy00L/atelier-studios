// User account functions. Passwords are hashed in the Node route handlers
// (src/lib/passwords.ts); Convex only stores and returns the opaque hash string.
// sourceRef: docs/hackathon/API_CONTRACT.md (Auth endpoints).

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireSession } from "./lib/sessions";

// Create an account. Returns a distinct failure when the email already exists so
// the route handler can map it to 409 EMAIL_TAKEN. Email is stored lowercased.
export const createUser = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (index) => index.eq("email", email))
      .unique();
    if (existing !== null) {
      return { ok: false as const, reason: "email_taken" as const };
    }
    const userId = await ctx.db.insert("users", {
      email,
      passwordHash: args.passwordHash,
      name: args.name,
      role: "member",
    });
    return { ok: true as const, user: { id: userId, email, name: args.name, role: "member" as const } };
  },
});

// Return the material the login route needs to verify a password. The hash never
// reaches the browser: the Node route handler consumes it and returns only a
// token. Null when the email is unknown (login then returns a generic 401).
export const getAuthMaterialByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (index) => index.eq("email", email))
      .unique();
    if (user === null) {
      return null;
    }
    return { userId: user._id, passwordHash: user.passwordHash };
  },
});

// The authenticated user's public profile, or null when the token is invalid.
export const getMe = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) {
      return null;
    }
    const user = await ctx.db.get(session.userId);
    if (user === null) {
      return null;
    }
    return { id: user._id, email: user.email, name: user.name, role: user.role };
  },
});
