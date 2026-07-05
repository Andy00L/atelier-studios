# Chosen submission idea: Atelier (working name)

Decision date: July 5, 2026. Based on two research passes: a capability map of the TestSprite CLI and an analysis of the 17 featured projects on testsprite.com/discover. Key findings are summarized here so no session repeats the research.

## Research findings that drove the choice

From the CLI capability map:

- Backend test runs are FREE (fresh frontend runs cost credits; verbatim passing frontend replays are free). Strategy: a large backend REST suite for unlimited free loop iterations, plus a small set of targeted frontend flows.
- The backend engine's most differentiated features: chained REST resources with dependent IDs (`--produces`/`--needs`), wave-ordered runs, automatic teardown, and generated probes that check protected routes actually reject unauthorized callers.
- Frontend tests want deterministic multi-step flows, stable `data-testid` selectors, and a visible confirmation state to assert on. The docs' canonical example is a checkout wizard ending on a confirmation screen.
- Unsupported, avoid relying on: websockets/realtime, outbound webhooks, GraphQL, third-party OAuth consent, CAPTCHAs, visual regression, nondeterministic content.
- Auth for tests: a seeded test account with static credentials, set at project level (`--username/--password`).
- CI: `test run --all` covers backend only; frontend tests run by test id (script a loop over `test list`). Idempotency keys for safe retries.
- Failure bundle: failing step, DOM as text, test source, root-cause hypothesis, recommended fix target, all anchored to one snapshotId. Triage flow: `test failure summary` then `test failure get --out` then fix then `test rerun --wait`.

From the past-projects analysis:

- Saturated categories in the TestSprite gallery: multi-agent AI simulators, AI wrappers/agents, AI content generators, natural-language builders, social/chat platforms, meta devtools built on TestSprite itself. Avoid all of these.
- What featured projects did right: a judge-facing evidence file in the repo (CinePurr's HACKATHON_EVIDENCE checklist), `data-testid` tagging designed for the tester (Text2Form), named real bugs caught by TestSprite in the README (PolyDub), a Medium/dev.to retrospective (SketchMotion).
- Identified gap: nothing in the gallery is a deterministic, transactional, state-machine product (booking, settlement, reconciliation), which is exactly the shape a test loop demonstrates best.

## The idea

**Atelier: a multi-role reservation engine for creative studios (photo, music, podcast), with holds, waitlists, and hard anti-double-booking invariants.**

A member browses studios, picks a slot, gets a short-lived hold (TTL), confirms, and lands on an explicit confirmation screen. If a slot is taken, they join a waitlist; a cancellation promotes the first person in line. An admin manages studios, blackout windows, and overrides. Every state transition is an objective, assertable invariant: no two confirmed bookings may ever overlap.

### Why it maximizes each judging category

- **Loop Quality (40)**: the domain generates real, subtle bugs that the checker genuinely catches: partial slot overlaps, hold-TTL expiry races, double-confirmation idempotency, cancellation windows, waitlist promotion order, timezone/midnight boundaries. Backend runs are free, so the loop can iterate without credit limits. Target: 10 to 15 honest iterations minimum, logged in LOOP.md.
- **Project Quality (40)**: a premium, focused product surface (studio gallery, availability grid, booking wizard, admin console) built with the design-motion kit. Works impressively at the live URL without explanation.
- **Innovation (20 +5)**: creativity of the loop design, not just the app: checker-first development (the test is created and fails red BEFORE the feature is built, then goes green), failure bundles committed to the repo as evidence, a public `/loop` page in the app that renders LOOP.md itself (the live app displays its own build journal), and the GitHub Actions gate for the +5.

### Feature list (2-day scope)

1. Email/password auth with two roles (member, admin) and a seeded test account for TestSprite.
2. Studios: name, equipment tags, hourly price, photos, opening rules.
3. Availability engine: fixed-grid slots, admin blackout windows.
4. Booking flow: slot select, 10-minute hold with TTL, confirm, confirmation screen with booking reference.
5. Conflict rejection: overlapping bookings return a distinct 409; DB-level exclusion constraint as the last line of defense.
6. Waitlist: join when full, automatic promotion on cancellation.
7. Cancellation with a time-window rule.
8. Admin console: studios CRUD, blackouts, override/cancel any booking.
9. REST API, about 15 endpoints, strict validation, distinct error messages per failure mode.
10. Public `/loop` page rendering LOOP.md.

### Testable surface mapping (what the checker exercises)

- Backend chains: admin creates studio (produces studioId), member creates hold (produces holdId), confirm booking (produces bookingId), attempt overlapping hold (assert 409), cancel, assert waitlist promotion, teardown deletes everything.
- Auth probes: anonymous vs member vs admin on every protected route.
- Edge cases: past slots, expired holds, double confirm, cancel outside window, boundary times (midnight, slot edges), malformed payloads.
- Frontend flows (credit-efficient, 3 to 4 tests): full booking wizard to confirmation screen, waitlist join, admin blackout creation, login failure path.

### Determinism guards (design decisions made now)

- Hold TTL configurable by environment variable; a documented internal expiry-check endpoint makes TTL behavior testable without waiting on wall-clock time.
- Fixed slot grid (no free-form times) keeps UI flows deterministic.
- Seeded demo data (studios, one admin, one member) via an idempotent seed script.
- `data-testid` on every interactive element from the first component.

### Stack

- Next.js (latest, App Router) + Bun, per project standards. One repo, API as route handlers.
- Convex (replaced Supabase on July 5, user decision): document database with TypeScript server functions. Convex mutations run as serializable ACID transactions, so the anti-overlap invariant is enforced inside the booking mutation (check-then-insert is race-free there). The REST surface TestSprite tests stays on Next.js route handlers at the Vercel URL, calling Convex server-side. Production deployment: patient-ox-888 (client URL https://patient-ox-888.convex.cloud, HTTP actions https://patient-ox-888.convex.site).
- Deploy: Vercel (native Next.js host; per-PR preview deployments pair with the CLI's `--target-url` for CI testing). Railway/Render stay as plan B if a persistent worker ever becomes necessary; the lazy TTL design avoids needing one. Public URL on day one, before any feature work.
- GitHub repo name: `atelier-studios` (product name in UI and README: Atelier).
- CI: GitHub Actions gated on TestSprite (backend `--all` plus a scripted frontend test-id loop).

### Evidence plan (judge-facing, from winner patterns)

- `LOOP.md`: agent-written during the loop, per LOOP_PROTOCOL.md.
- `docs/hackathon/EVIDENCE.md`: checklist with dashboard screenshots and test inventory, modeled on CinePurr.
- Committed failure bundles under `.testsprite/failures/` (gitignore review first: no secrets in bundles).
- README names the exact real bugs the loop caught, like PolyDub.
- Optional engagement: dev.to write-up on the checker-first loop, X post.

## Rejected alternatives (recorded so they are not re-proposed)

- Split-fair expense settlement engine: strong invariants but reads as a Splitwise clone; weaker premium surface in 2 days.
- Data-integrity importer/reconciliation tool: objective pass/fail but a dull live demo; Project Quality risk.
- Anything in the saturated categories listed above.
