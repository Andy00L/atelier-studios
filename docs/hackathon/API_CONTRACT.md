# Atelier API contract (authoritative)

Every route handler, Convex function, backend test, and UI call follows THIS file. If an implementation detail conflicts with this file, this file wins; update it first if a change is genuinely needed, and record why in HANDOFF.md.

Base URL: https://atelier-studios-opal.vercel.app
All bodies are JSON. All times are epoch milliseconds UTC in the API. Slots are fixed 60-minute blocks starting on the hour.

## Conventions

Success envelope: the resource object directly (no wrapper).
Error envelope, always this exact shape and always matching the HTTP status:

```json
{ "error": { "code": "SLOT_CONFLICT", "message": "human readable, specific" } }
```

Error codes (distinct code per failure mode, never reuse):

| HTTP | code | used when |
|---|---|---|
| 400 | VALIDATION_ERROR | malformed body, missing field, wrong type, misaligned slot times |
| 401 | UNAUTHORIZED | missing or invalid bearer token |
| 403 | FORBIDDEN | valid token, insufficient role, or not the owner |
| 403 | OUTSIDE_CANCEL_WINDOW | cancel attempted under the cutoff (member only; admin bypasses) |
| 404 | NOT_FOUND | unknown id or slug |
| 409 | SLOT_CONFLICT | hold/booking overlaps an active hold, confirmed booking, or blackout |
| 409 | SLOT_NOT_FULL | waitlist join attempted on a slot that is actually free |
| 409 | ALREADY_WAITLISTED | duplicate waitlist entry by the same user for the same slot |
| 410 | HOLD_EXPIRED | confirm attempted on an expired hold |
| 422 | SLOT_IN_PAST | hold attempted on a slot whose start is in the past |
| 422 | OUTSIDE_OPEN_HOURS | slot outside the studio's open hours or beyond the booking horizon |

Business rules (constants; single source of truth is `src/lib/config.ts`, values injected via env where noted):

- HOLD_TTL_SECONDS = 600 (env `HOLD_TTL_SECONDS`; short values allowed in tests)
- CANCEL_CUTOFF_HOURS = 2 (cancellation allowed until 2 hours before start)
- BOOKING_HORIZON_DAYS = 30 (no holds beyond 30 days out)
- SLOT_MINUTES = 60 (grid; slot start must be exactly on the hour, within open hours)
- Booking reference format: `ATL-` + 6 uppercase alphanumerics, unique.

Auth: `Authorization: Bearer <token>` header. Tokens come from POST /api/auth/login. Roles: `member`, `admin`.

## Endpoints

### Auth

1. `POST /api/auth/register` (public)
   Body: `{ "email": string, "password": string (min 8), "name": string }`
   201: `{ "id", "email", "name", "role": "member" }` (never returns the password hash)
   Errors: VALIDATION_ERROR; 409 code `EMAIL_TAKEN` if the email exists.
2. `POST /api/auth/login` (public)
   Body: `{ "email", "password" }`
   200: `{ "token": string, "user": { "id", "email", "name", "role" } }`
   Errors: 401 UNAUTHORIZED (same message for wrong email and wrong password: no user enumeration).
3. `POST /api/auth/logout` (auth) 204, invalidates the token.
4. `GET /api/me` (auth) 200: `{ "id", "email", "name", "role" }`.

### Studios

5. `GET /api/studios` (public) 200: array of `{ "id", "slug", "name", "description", "equipment": string[], "hourlyPriceCents", "photoUrl", "openHour", "closeHour", "active" }`. Only active studios.
6. `GET /api/studios/{slug}` (public) 200: one studio. 404 NOT_FOUND.
7. `POST /api/studios` (admin) body: all fields above except id/slug (slug derived from name). 201: the studio. FORBIDDEN for members.
8. `PATCH /api/studios/{id}` (admin) partial body. 200: updated studio.
9. `DELETE /api/studios/{id}` (admin) 204. Sets `active: false` (soft delete; bookings history stays intact).

### Availability

10. `GET /api/studios/{id}/availability?from=<epochMs>&to=<epochMs>` (public)
    200: `{ "slots": [ { "startTs", "endTs", "status": "free" | "held" | "booked" | "blackout" | "past" } ] }`
    Rules: expired holds count as free (lazy expiry runs first). Range capped at 14 days per request (VALIDATION_ERROR beyond).

### Holds

11. `POST /api/holds` (auth)
    Body: `{ "studioId", "startTs", "endTs" }`
    201: `{ "id", "studioId", "startTs", "endTs", "expiresAt", "status": "active" }`
    Errors: VALIDATION_ERROR (misaligned grid), SLOT_IN_PAST, OUTSIDE_OPEN_HOURS, SLOT_CONFLICT (overlap with active hold, confirmed booking, or blackout).
    A user re-requesting the same slot they already hold gets their existing active hold back with 200 (idempotent), not a conflict.
12. `DELETE /api/holds/{id}` (auth, owner only) 204: releases the hold (`status: "released"`).

### Bookings

13. `POST /api/bookings` (auth)
    Body: `{ "holdId" }`
    201: `{ "id", "reference", "studioId", "startTs", "endTs", "status": "confirmed", "priceCents" }`
    Idempotent: confirming an already-converted hold returns 200 with the SAME booking (never a duplicate).
    Errors: HOLD_EXPIRED (410, hold past expiresAt: lazy expiry marks it expired), NOT_FOUND (unknown hold), FORBIDDEN (someone else's hold).
14. `GET /api/bookings` (auth) 200: member sees own bookings; admin sees all (query `?all=true` admin only).
15. `DELETE /api/bookings/{id}` (auth)
    204: cancels (`status: "cancelled"`), then promotes the oldest waiting waitlist entry for that exact slot, if any, into an active hold (fresh TTL) and marks the entry `promoted`.
    Errors: OUTSIDE_CANCEL_WINDOW (member under the cutoff; admins bypass), FORBIDDEN (not owner, not admin), NOT_FOUND.

### Waitlist

16. `POST /api/waitlist` (auth)
    Body: `{ "studioId", "startTs", "endTs" }`
    201: `{ "id", "position" }`
    Errors: SLOT_NOT_FULL (slot is actually free: book it instead), ALREADY_WAITLISTED, VALIDATION_ERROR.
17. `GET /api/waitlist` (auth) 200: own waiting entries with positions.
18. `DELETE /api/waitlist/{id}` (auth, owner) 204.

### Admin

19. `POST /api/blackouts` (admin) body `{ "studioId", "startTs", "endTs", "reason" }` 201. Overlapping ACTIVE holds are released and CONFIRMED bookings inside the window are cancelled with waitlist entries discarded (blackout wins; affected list returned in the response as `{ "releasedHolds": n, "cancelledBookings": n }`).
20. `DELETE /api/blackouts/{id}` (admin) 204.

### System

21. `GET /api/health` (public) 200: `{ "status": "ok", "service": "atelier-studios", "timestamp", "commit" }`. `commit` = `VERCEL_GIT_COMMIT_SHA` env (short), used by the loop to detect that a deploy is live. (EXISTS; commit field to be added in Phase 0 completion.)
22. `POST /api/internal/expire-holds` (header `x-internal-key: <INTERNAL_TASK_KEY env>`) 200: `{ "expired": n }`. Forces lazy expiry for deterministic TTL tests. 401 without the key. Never documented in the public README API table.

## Invariant (the heart of the product)

At any moment, for a given studio, the time ranges of (active non-expired holds) plus (confirmed bookings) plus (blackouts) are pairwise non-overlapping. This is enforced inside a single Convex mutation (serializable transaction): re-check for overlap immediately before insert. Every conflict path returns SLOT_CONFLICT, never a silent success.

## Seeded accounts (Phase 1, used by TestSprite)

- admin: `admin@atelier.test` / password in `.env.local` as SEED_ADMIN_PASSWORD (never hardcoded in tests committed to the repo; tests read it from the TestSprite project settings or a constant documented in the platform project, see BUILD_PLAN.md)
- member: `member@atelier.test` / SEED_MEMBER_PASSWORD
- Plus 3 demo studios (photo, music, podcast) with distinct open hours and prices.
