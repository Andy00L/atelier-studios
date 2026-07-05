// Time and slot-grid helpers shared by Convex functions. Pure functions, no
// Convex imports. sourceRef: docs/hackathon/API_CONTRACT.md (Business rules).

import { MS_PER_MINUTE, SLOT_MINUTES } from "./rules";

// A slot is valid when start is exactly on the grid, end is exactly one grid
// step after start, and both land on minute boundaries. Returns why it failed
// so callers can produce a distinct error (errors as values, no throw).
export function checkSlotAlignment(
  startTs: number,
  endTs: number,
): { ok: true } | { ok: false; reason: "not_integer" | "misaligned" | "wrong_length" } {
  if (!Number.isInteger(startTs) || !Number.isInteger(endTs)) {
    return { ok: false, reason: "not_integer" };
  }
  const slotMs = SLOT_MINUTES * MS_PER_MINUTE;
  if (startTs % slotMs !== 0) {
    return { ok: false, reason: "misaligned" };
  }
  if (endTs - startTs !== slotMs) {
    return { ok: false, reason: "wrong_length" };
  }
  return { ok: true };
}

// The hour-of-day (0 to 23) in UTC for a timestamp, used to check a studio's
// open hours. Kept UTC on purpose so tests are timezone-deterministic.
export function utcHourOf(timestampMs: number): number {
  return new Date(timestampMs).getUTCHours();
}
