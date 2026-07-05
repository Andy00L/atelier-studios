// Next.js-side access to the business rules. Re-exports the single source of
// truth in convex/lib/rules.ts so there is never a second copy of a constant.
// Env-driven values (hold TTL, internal key, seed passwords) are read here from
// process.env and passed into Convex functions as arguments.

export * from "@/convex/lib/rules";

import { DEFAULT_HOLD_TTL_SECONDS } from "@/convex/lib/rules";

// Resolve the hold TTL: env override first, then the documented default.
// Returns seconds. Invalid or non-positive env values fall back to the default.
export function resolveHoldTtlSeconds(): number {
  const raw = process.env.HOLD_TTL_SECONDS;
  if (raw === undefined) {
    return DEFAULT_HOLD_TTL_SECONDS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_HOLD_TTL_SECONDS;
  }
  return parsed;
}

// The shared secret guarding POST /api/internal/expire-holds. Absent means the
// endpoint is disabled (every call is rejected), which is the safe default.
export function internalTaskKey(): string | undefined {
  return process.env.INTERNAL_TASK_KEY;
}
