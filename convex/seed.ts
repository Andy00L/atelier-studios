// Idempotent demo seed. Password hashes are computed in Node (scrypt) and passed
// in, because the Convex runtime has no scrypt. Run non-interactively:
//   bunx convex run seed:seedDemo '{"adminPasswordHash":"...","memberPasswordHash":"..."}'
// internalMutation so it is not callable from the public deployment URL.
// sourceRef: docs/hackathon/BUILD_PLAN.md (C7).

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const ADMIN_EMAIL = "admin@atelier.test";
const MEMBER_EMAIL = "member@atelier.test";

// Three demo studios with distinct open hours (UTC) and prices. photoUrl points
// at static assets under public/studios; the UI falls back to a gradient if a
// file is missing.
const DEMO_STUDIOS = [
  {
    slug: "aurora-photo",
    name: "Aurora Photo Studio",
    description: "Daylight-balanced cyclorama with a full strobe kit and tethered capture.",
    equipment: ["Profoto B10 strobes", "paper sweep backdrops", "tethering station"],
    hourlyPriceCents: 8000,
    photoUrl: "/studios/aurora-photo.jpg",
    openHour: 8,
    closeHour: 20,
  },
  {
    slug: "resonance-music",
    name: "Resonance Music Room",
    description: "Treated live room and control booth for tracking and mixing.",
    equipment: ["Neumann U87", "SSL console", "grand piano"],
    hourlyPriceCents: 6000,
    photoUrl: "/studios/resonance-music.jpg",
    openHour: 10,
    closeHour: 24,
  },
  {
    slug: "signal-podcast",
    name: "Signal Podcast Booth",
    description: "Four-seat podcast booth with broadcast mics and one-touch recording.",
    equipment: ["Shure SM7B x4", "Rodecaster Pro II", "acoustic treatment"],
    hourlyPriceCents: 3500,
    photoUrl: "/studios/signal-podcast.jpg",
    openHour: 6,
    closeHour: 22,
  },
];

export const seedDemo = internalMutation({
  args: { adminPasswordHash: v.string(), memberPasswordHash: v.string() },
  handler: async (ctx, args) => {
    const upsertUser = async (
      email: string,
      name: string,
      role: "member" | "admin",
      passwordHash: string,
    ) => {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (index) => index.eq("email", email))
        .unique();
      if (existing === null) {
        await ctx.db.insert("users", { email, passwordHash, name, role });
      } else {
        await ctx.db.patch(existing._id, { passwordHash, name, role });
      }
    };

    await upsertUser(ADMIN_EMAIL, "Atelier Admin", "admin", args.adminPasswordHash);
    await upsertUser(MEMBER_EMAIL, "Demo Member", "member", args.memberPasswordHash);

    for (const studio of DEMO_STUDIOS) {
      const existing = await ctx.db
        .query("studios")
        .withIndex("by_slug", (index) => index.eq("slug", studio.slug))
        .unique();
      if (existing === null) {
        await ctx.db.insert("studios", { ...studio, active: true });
      } else {
        await ctx.db.patch(existing._id, { ...studio, active: true });
      }
    }

    return { ok: true as const, users: 2, studios: DEMO_STUDIOS.length };
  },
});
