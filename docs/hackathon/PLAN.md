# Execution plan: Atelier (atelier-studios)

Window: July 5 evening to July 7, 4:59 PM PDT. The order below is loop-first: nothing is "done" until the checker has seen it. Full idea and rationale in [IDEA.md](IDEA.md); loop mechanics in [LOOP_PROTOCOL.md](LOOP_PROTOCOL.md).

## Standing rules for every step

- The agent writes code and LOOP.md; the human runs every git command. Commit after every loop iteration (granular history is 40 points of proof).
- Deploy first, build second: the checker only tests the public URL.
- Backend loops are free; frontend runs cost credits. Iterate hard on the API suite, keep frontend tests to 3 or 4 high-value flows run sparingly.
- Checker-first where practical: create the test, watch it fail red, build the feature, watch it pass green, log both entries in LOOP.md.
- `data-testid` on every interactive element from the first component.

## Phase 0: accounts and skeleton (target: 2-3 hours)

1. Human: run the repo init block (done or in progress).
2. Human provides: TestSprite API key, Supabase project (URL, anon key, service role key), Vercel account with the GitHub repo imported.
3. Agent: scaffold Next.js (latest, App Router, TypeScript) with Bun. Note: the project dir is non-empty (docs, .claude, README), so scaffold into a temp subfolder and merge, or use --force equivalent after checking conflicts. Keep README.md, merge content later.
4. Agent: minimal homepage + `/api/health` endpoint returning build info.
5. Human: push; Vercel auto-deploys; confirm the public URL responds.
6. Agent: `testsprite setup` with the API key, `testsprite project create` (backend + frontend) pointed at the Vercel URL. First trivial test created and run: LOOP.md iteration 1 banked.

Exit criteria: public URL live, TestSprite project exists, LOOP.md has its first honest entry.

## Phase 1: data model and auth (target: 3-4 hours)

1. Supabase schema: studios, slots (fixed grid), holds (TTL), bookings, waitlist entries, profiles with role (member, admin). Postgres exclusion constraint on overlapping confirmed bookings.
2. Email/password auth via Supabase; seeded accounts: one admin, one member (static credentials for the TestSprite project settings).
3. Idempotent seed script (studios, opening rules, demo data).
4. Loop: backend tests on auth probes (anonymous vs member vs admin) and health of seeded data.

## Phase 2: booking engine API (target: 6-8 hours, the core)

Build endpoint by endpoint, each with its checker-first loop iteration:

1. Studios CRUD (admin) + public listing/detail.
2. Availability: slots for a studio and date range, minus blackouts and confirmed bookings.
3. Hold creation (TTL, one active hold per member per slot), distinct 409 on conflict.
4. Confirm hold into booking (idempotent; expired hold rejected with a distinct error).
5. Cancel with time-window rule; waitlist join; automatic promotion on cancellation.
6. Admin: blackout windows, override cancel.
7. Internal expiry-check endpoint so TTL behavior is testable without waiting on wall-clock.

Loop targets here: overlap edge cases (partial, exact, adjacent), double confirm, expired hold, cancel outside window, waitlist order, boundary times. This phase should generate the majority of the 10-15+ LOOP.md iterations, including real caught bugs.

## Phase 3: premium UI (target: 6-8 hours)

Trigger the design-motion kit (router + playbook + SKILL_UI) before any component work.

1. Studio gallery and detail (photos, equipment tags, pricing).
2. Availability grid + booking wizard ending on a confirmation screen with booking reference (the canonical frontend-test shape).
3. Member dashboard (bookings, holds, waitlist) and cancel flow.
4. Admin console (studios, blackouts, overrides).
5. Public `/loop` page rendering LOOP.md.
6. Frontend TestSprite tests (3-4): booking wizard end-to-end, waitlist join, login failure path, admin blackout. Run once green, rerun only on regressions (verbatim passing replays are free).

## Phase 4: CI/CD gate (+5 points) (target: 1-2 hours)

1. GitHub Actions on pull_request: install CLI, `test run --all` (backend) plus scripted frontend run by test id, `--output json`, failure bundle uploaded as artifact on red.
2. `TESTSPRITE_API_KEY` as a GitHub secret (human adds it; agent never handles the key in the repo).
3. Use Vercel preview URL with `--target-url` where practical.

## Phase 5: evidence and submission (target: 2-3 hours, finish July 7 morning)

1. README per readme-craft skill: app, live URL, what the loop covered, the exact real bugs the loop caught.
2. `docs/hackathon/EVIDENCE.md`: test inventory, dashboard screenshots, run history pointers.
3. Verify LOOP.md, commit history, and platform run history tell the same story.
4. Run the full SUBMISSION.md checklist; human submits the Google Form and the Discord post before the deadline; recheck announcements for rule changes.
5. Optional if time remains: short demo video; dev.to write-up on the checker-first loop (engagement bonus).

## Blocking inputs needed from the human (in order of urgency)

1. TestSprite API key (create account, run setup with the agent).
2. Supabase project URL + anon key + service role key (as environment variables, never committed).
3. Vercel: import the GitHub repo, add the Supabase env vars, confirm the production URL.
4. Later: `TESTSPRITE_API_KEY` added as a GitHub Actions secret.

## Credit strategy

Free tier is 150 credits/month and frontend runs consume them. If the boost form (link in OVERVIEW.md) has not been submitted yet, do it at Phase 0. Backend-heavy looping costs nothing; schedule frontend test creation late (Phase 3) and batch reruns.
