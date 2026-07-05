// Studio catalog and admin CRUD. sourceRef: docs/hackathon/API_CONTRACT.md
// (Studios endpoints 5-9).

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireSession } from "./lib/sessions";
import { slugify } from "./lib/ids";

// Shape a stored studio into the public object the API returns.
function toPublicStudio(studio: Doc<"studios">) {
  return {
    id: studio._id,
    slug: studio.slug,
    name: studio.name,
    description: studio.description,
    equipment: studio.equipment,
    hourlyPriceCents: studio.hourlyPriceCents,
    photoUrl: studio.photoUrl,
    openHour: studio.openHour,
    closeHour: studio.closeHour,
    active: studio.active,
  };
}

// Validate open/close hours: integers in range with open strictly before close.
function checkHours(openHour: number, closeHour: number): boolean {
  if (!Number.isInteger(openHour) || !Number.isInteger(closeHour)) return false;
  if (openHour < 0 || openHour > 23) return false;
  if (closeHour < 1 || closeHour > 24) return false;
  return openHour < closeHour;
}

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const studios = await ctx.db.query("studios").collect();
    return studios.filter((studio) => studio.active).map(toPublicStudio);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const studio = await ctx.db
      .query("studios")
      .withIndex("by_slug", (index) => index.eq("slug", args.slug))
      .unique();
    if (studio === null || !studio.active) {
      return null;
    }
    return toPublicStudio(studio);
  },
});

// Admin-only create. Slug is derived from the name; a collision gets a numeric
// suffix so the operation never fails on a near-duplicate name.
export const create = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    equipment: v.array(v.string()),
    hourlyPriceCents: v.number(),
    photoUrl: v.string(),
    openHour: v.number(),
    closeHour: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };
    if (session.role !== "admin") return { ok: false as const, reason: "forbidden" as const };
    if (args.name.trim().length === 0) return { ok: false as const, reason: "validation" as const };
    if (!Number.isInteger(args.hourlyPriceCents) || args.hourlyPriceCents < 0) {
      return { ok: false as const, reason: "validation" as const };
    }
    if (!checkHours(args.openHour, args.closeHour)) {
      return { ok: false as const, reason: "validation" as const };
    }

    const baseSlug = slugify(args.name);
    let slug = baseSlug;
    let suffix = 2;
    while (
      (await ctx.db
        .query("studios")
        .withIndex("by_slug", (index) => index.eq("slug", slug))
        .unique()) !== null
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const studioId = await ctx.db.insert("studios", {
      slug,
      name: args.name,
      description: args.description,
      equipment: args.equipment,
      hourlyPriceCents: args.hourlyPriceCents,
      photoUrl: args.photoUrl,
      openHour: args.openHour,
      closeHour: args.closeHour,
      active: true,
    });
    const created = await ctx.db.get(studioId);
    if (created === null) return { ok: false as const, reason: "validation" as const };
    return { ok: true as const, studio: toPublicStudio(created) };
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    studioId: v.id("studios"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    equipment: v.optional(v.array(v.string())),
    hourlyPriceCents: v.optional(v.number()),
    photoUrl: v.optional(v.string()),
    openHour: v.optional(v.number()),
    closeHour: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };
    if (session.role !== "admin") return { ok: false as const, reason: "forbidden" as const };
    const studio = await ctx.db.get(args.studioId);
    if (studio === null) return { ok: false as const, reason: "not_found" as const };

    const nextOpenHour = args.openHour ?? studio.openHour;
    const nextCloseHour = args.closeHour ?? studio.closeHour;
    if (!checkHours(nextOpenHour, nextCloseHour)) {
      return { ok: false as const, reason: "validation" as const };
    }

    const patch: Partial<Doc<"studios">> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.equipment !== undefined) patch.equipment = args.equipment;
    if (args.hourlyPriceCents !== undefined) patch.hourlyPriceCents = args.hourlyPriceCents;
    if (args.photoUrl !== undefined) patch.photoUrl = args.photoUrl;
    if (args.openHour !== undefined) patch.openHour = args.openHour;
    if (args.closeHour !== undefined) patch.closeHour = args.closeHour;
    await ctx.db.patch(args.studioId, patch);
    const updated = await ctx.db.get(args.studioId);
    if (updated === null) return { ok: false as const, reason: "not_found" as const };
    return { ok: true as const, studio: toPublicStudio(updated) };
  },
});

// Soft delete: keep booking history intact, just mark inactive.
export const softDelete = mutation({
  args: { sessionToken: v.string(), studioId: v.id("studios") },
  handler: async (ctx, args) => {
    const session = await requireSession(ctx, args.sessionToken);
    if (!session.ok) return { ok: false as const, reason: "unauthorized" as const };
    if (session.role !== "admin") return { ok: false as const, reason: "forbidden" as const };
    const studio = await ctx.db.get(args.studioId);
    if (studio === null) return { ok: false as const, reason: "not_found" as const };
    await ctx.db.patch(args.studioId, { active: false });
    return { ok: true as const };
  },
});
