// Business rules for Atelier: the single source of truth for every numeric
// constant. Pure TypeScript with no Convex imports so it can be bundled by both
// the Convex runtime (convex/ functions) and the Next.js runtime (re-exported by
// src/lib/config.ts). sourceRef: docs/hackathon/API_CONTRACT.md (Business rules).

// Slot grid size in minutes. Slot starts must land exactly on this grid.
export const SLOT_MINUTES = 60;

// Default hold time-to-live in seconds. Overridable per request via the
// HOLD_TTL_SECONDS env var read in the route handler (short values keep TTL
// behavior testable). This constant is the fallback when the env is unset.
export const DEFAULT_HOLD_TTL_SECONDS = 600;

// A member may cancel a booking until this many hours before its start.
// Admins bypass this window.
export const CANCEL_CUTOFF_HOURS = 2;

// No hold may be created for a slot starting more than this many days ahead.
export const BOOKING_HORIZON_DAYS = 30;

// Availability queries may span at most this many days per request.
export const AVAILABILITY_RANGE_MAX_DAYS = 14;

// Session lifetime in seconds (7 days). The login route hashes the raw token
// and stores expiresAt = now + this.
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

// Booking reference: "ATL-" + this many uppercase alphanumerics.
export const BOOKING_REFERENCE_PREFIX = "ATL-";
export const BOOKING_REFERENCE_BODY_LENGTH = 6;

// Milliseconds per second/minute/hour/day, to keep time math readable.
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
