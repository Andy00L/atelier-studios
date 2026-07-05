// Pure id/slug helpers for Convex functions. No Convex imports.
// sourceRef: docs/hackathon/API_CONTRACT.md (Conventions).

import { BOOKING_REFERENCE_BODY_LENGTH, BOOKING_REFERENCE_PREFIX } from "./rules";

// URL-safe slug from a display name: lowercase, non-alphanumerics to hyphens,
// collapse and trim hyphens. Uniqueness is enforced by the caller.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// A booking reference like ATL-4F9K2Q. Uses crypto.getRandomValues (a global in
// the Convex runtime) over an unambiguous alphabet (no O/0/I/1). Uniqueness is
// verified by the caller against the by_reference index.
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookingReference(): string {
  const randomValues = new Uint8Array(BOOKING_REFERENCE_BODY_LENGTH);
  crypto.getRandomValues(randomValues);
  let body = "";
  for (const value of randomValues) {
    body += REFERENCE_ALPHABET[value % REFERENCE_ALPHABET.length];
  }
  return BOOKING_REFERENCE_PREFIX + body;
}
