# BUILD_PLAN.md: the authoritative step-by-step plan to first place

This file supersedes the phase outline in PLAN.md. It is written so that ANY session, including a less capable model, can execute the next step without improvising. Follow it top to bottom. Do not skip gates. Do not reorder phases. When a step says STOP, stop and ask the human.

Companion files (read when the plan says so, not all at once):

- [API_CONTRACT.md](API_CONTRACT.md): every endpoint, error code, business rule. The single source of truth for behavior.
- [TESTSPRITE_CLI.md](TESTSPRITE_CLI.md): every TestSprite command used below, with flags.
- [LOOP_PROTOCOL.md](LOOP_PROTOCOL.md): LOOP.md line format and honesty rules.
- [HANDOFF.md](HANDOFF.md): live status. UPDATE IT at the end of every session.

## 0. Session bootstrap ritual (every session, in order)

1. Run the standards proof from `.claude/CLAUDE.md` (list kit files, quote the two H1s, name on-demand skills). Include the acknowledgement line in every reply.
2. Read HANDOFF.md, then this file. Find the first unchecked `[ ]` gate below: that is the next task.
3. Every WSL command uses this wrapper (Bun and the TestSprite CLI live in `~/.bun/bin`):
   ```bash
   wsl -e bash -lc "export PATH=\$HOME/.bun/bin:\$PATH && cd ~/testsprite && <command>"
   ```
4. Verify the app is live before loop work: `curl -sS https://atelier-studios-opal.vercel.app/api/health` must return `{"status":"ok",...}`.
5. NON-NEGOTIABLES: the agent never runs any git command (print handoff blocks starting with `cd ~/testsprite`; the human runs them). LOOP.md lines are appended ONLY for runs that actually happened on the platform. Never commit secrets; keys live in `.env.local`, the CLI profile, or Vercel/GitHub settings. French in chat, English in every repo artifact. No em dash or en dash anywhere; grep before finishing (`.claude/SKILL_GENERAL.md` section 8 lists banned words).
6. Definition of done for EVERY step: build green (`bun run build` via the wrapper), the step's gate checked, HANDOFF.md updated, files-affected report printed, git handoff printed.

## 1. State snapshot (July 5, ~10:30 UTC)

DONE: planning docs; Next.js 16.2.10 + Tailwind v4 scaffold at repo root; `/api/health` with `commit` field (build green, NOT yet pushed); TestSprite CLI 0.2.0 configured (account andy.luemba@protonmail.com); convex 1.42.1 installed (esbuild postinstall trusted); scaffold commit pushed to GitHub.

BROKEN: the Vercel production URL serves 404 (`x-vercel-error: NOT_FOUND`): the live deployment predates the scaffold push. Phase A fixes this.

MISSING: CONVEX_DEPLOY_KEY from the human; all Convex code; all API endpoints except health; all UI; all tests; LOOP.md; CI; README; submission.

Time budget (deadline July 7, 4:59 PM PDT = 23:59 UTC): Phase A+B by July 5 midday; C+D by July 5 evening; E by July 6 midday; F by July 6 evening; G+H July 6 night; I+J July 7 morning; K July 7 by 20:00 UTC (4 hours of slack before the deadline).

## Phase A: unblock the deploy (BLOCKED ON HUMAN, verify then proceed)

- [ ] A1. Human, in the Vercel dashboard for `atelier-studios`: Settings > Build and Deployment > Framework Preset = **Next.js** (it is probably "Other" because the repo only had a README at import time). Then Deployments > Redeploy latest commit (or push any commit to trigger).
- [ ] A2. Human, same screen: set Build Command override to `npx convex deploy --cmd 'bun run build'` and add env var `CONVEX_DEPLOY_KEY` (Production scope) with a production deploy key generated in the Convex dashboard (patient-ox-888 > Settings > Deploy keys). This makes every Vercel build push Convex functions first and inject `NEXT_PUBLIC_CONVEX_URL` automatically. NOTE: until Phase C creates the `convex/` folder, this build command would fail, so human may set A2 AFTER Phase C lands; A1 alone unblocks Phase B. Agent: remind them at C6.
- [ ] A3. Agent gate: `curl -sS https://atelier-studios-opal.vercel.app/api/health` returns 200 with `service: "atelier-studios"`. Do not start Phase B before this passes.

## Phase B: TestSprite bootstrap and LOOP.md birth

- [ ] B1. Push pending local work first (health `commit` field). Handoff:
   ```bash
   cd ~/testsprite
   git add src/app/api/health/route.ts .env.example docs/hackathon package.json bun.lock .claude/skills/testsprite-verify .claude/skills/testsprite-onboard
   git commit -m "feat: health commit marker, convex dep, testsprite skills and build docs"
   git push
   ```
- [ ] B2. Invoke the `testsprite-onboard` skill (it exists in `.claude/skills/`) OR do it manually per TESTSPRITE_CLI.md: create the backend project (`--type backend --name atelier-api --url https://atelier-studios-opal.vercel.app`). Record the project id in HANDOFF.md. The frontend project waits until Phase G (its creation needs the seeded test account credentials).
- [ ] B3. Write `tests/testsprite/backend/test_health.py`: GET /api/health, assert 200, `status == "ok"`, `service == "atelier-studios"`, `commit` is a non-empty string. Create + run it: `testsprite test create --project <ID> --type backend --name "health endpoint" --code-file tests/testsprite/backend/test_health.py --run --wait --timeout 600`.
- [ ] B4. Create `LOOP.md` at the repo ROOT (judges look for it there), with this header and the first line, then NEVER edit old lines, only append:
   ```markdown
   # LOOP.md: the write-verify-fix-verify journal of Atelier

   Agent-written as the loop runs. One line per iteration: maker, what ran, verdict, what broke, what got fixed. Cross-check any line against the TestSprite platform run history and the commit that follows it.

   1. [maker: Claude Code] Created backend test "health endpoint" against /api/health; first run PASSED (deploy marker commit visible); banked as the loop's baseline.
   ```
   (Adapt line 1 to what actually happened; if the run failed, log the failure and the fix instead. NEVER invent.)
- [ ] B5. Gate: `testsprite test list --project <ID>` shows the test with a passed run. Handoff: add `tests/`, `LOOP.md`; commit `"test: bank health check, start LOOP.md"`.

## Phase C: Convex foundation

Read the Convex sections of this phase fully before typing. Key facts from research (verified July 5 against docs.convex.dev): mutations are serializable ACID transactions with automatic OCC retry, so check-then-insert inside ONE mutation is the correct overlap guard. `bunx convex ...` is called directly, never through `bun run` script wrappers. Codegen offline: `bunx convex codegen`. Deploy to production: `CONVEX_DEPLOY_KEY="prod:..." bunx convex deploy` (key from the human, in `.env.local`; if Bun's deploy misbehaves, fall back to `npx convex deploy`).

- [ ] C1. Create `convex/schema.ts` exactly with these tables (validators from `"convex/values"`, `defineSchema/defineTable` from `"convex/server"`):
   ```ts
   users:     { email: v.string(), passwordHash: v.string(), name: v.string(), role: v.union(v.literal("member"), v.literal("admin")) } .index("by_email", ["email"])
   sessions:  { userId: v.id("users"), tokenHash: v.string(), expiresAt: v.number() } .index("by_tokenHash", ["tokenHash"])
   studios:   { slug: v.string(), name: v.string(), description: v.string(), equipment: v.array(v.string()), hourlyPriceCents: v.number(), photoUrl: v.string(), openHour: v.number(), closeHour: v.number(), active: v.boolean() } .index("by_slug", ["slug"])
   holds:     { studioId: v.id("studios"), userId: v.id("users"), startTs: v.number(), endTs: v.number(), status: v.union(v.literal("active"), v.literal("expired"), v.literal("converted"), v.literal("released")), expiresAt: v.number() } .index("by_studio_start", ["studioId", "startTs"]) .index("by_user", ["userId"])
   bookings:  { studioId: v.id("studios"), userId: v.id("users"), startTs: v.number(), endTs: v.number(), status: v.union(v.literal("confirmed"), v.literal("cancelled")), reference: v.string(), holdId: v.id("holds"), priceCents: v.number(), cancelledAt: v.optional(v.number()) } .index("by_studio_start", ["studioId", "startTs"]) .index("by_user", ["userId"]) .index("by_hold", ["holdId"])
   waitlist:  { studioId: v.id("studios"), userId: v.id("users"), startTs: v.number(), endTs: v.number(), status: v.union(v.literal("waiting"), v.literal("promoted"), v.literal("cancelled")) } .index("by_studio_slot", ["studioId", "startTs"]) .index("by_user", ["userId"])
   blackouts: { studioId: v.id("studios"), startTs: v.number(), endTs: v.number(), reason: v.string() } .index("by_studio_start", ["studioId", "startTs"])
   ```
- [ ] C2. `convex/lib/sessions.ts`: helper `requireSession(ctx, sessionToken)` used by EVERY protected mutation/query: sha-256 the token (js-sha256 is not needed; use the Web Crypto `crypto.subtle.digest` available in Convex runtime, or store plain sha-256 hex computed in the route handler and passed... NO: hash INSIDE Convex so a stolen tokenHash is useless. Convex runtime supports Web Crypto). Look up `sessions.withIndex("by_tokenHash")`, check `expiresAt > Date.now()`, return `{ ok: true, userId, role }` or `{ ok: false }`. Every protected function returns `{ ok: false, reason: "unauthorized" }` when the session is invalid: enforcement lives in Convex because the deployment URL is public.
- [ ] C3. Overlap guard, the product's heart, inside the hold-creation mutation (and re-used at confirm): query `holds.withIndex("by_studio_start", q => q.eq("studioId", id).lt("startTs", newEnd))` plus the same on `bookings` and `blackouts`; in code, keep candidates with `endTs > newStart`; discard cancelled bookings, non-active holds, and active holds with `expiresAt <= now` (lazy expiry). Any survivor = conflict. Errors as values: `{ ok: false, reason: "slot_taken" }`.
- [ ] C4. Lazy expiry is authoritative everywhere a hold is read (availability, confirm, overlap checks). A hold with `expiresAt <= now` behaves as dead even if its status still says active; mutations that touch one on the way mark it `expired`. No cron needed for correctness (a cleanup cron is optional hygiene, skip unless time remains).
- [ ] C5. `bunx convex codegen` then `bun run build`: both green before deploy.
- [ ] C6. Get CONVEX_DEPLOY_KEY from the human (STOP if missing). Put it in `.env.local`. Deploy: `CONVEX_DEPLOY_KEY=... bunx convex deploy`. Then remind the human to do A2 (Vercel build command + env var) so future pushes deploy functions automatically.
- [ ] C7. `convex/seed.ts`: internal mutation `seedDemo` (idempotent: upsert by email/slug): admin `admin@atelier.test`, member `member@atelier.test` (password hashes computed with the SAME scrypt code path as register: factor the hashing into `src/lib/passwords.ts` and precompute hashes locally with a one-off script in `.scratch/`, since Convex functions cannot run node:crypto scrypt; document the generated hashes' provenance in the seed file comment), 3 studios (photo/music/podcast, distinct openHour/closeHour/prices). Passwords come from env: human picks them, agent never invents secrets. Run: `bunx convex run seed:seedDemo --prod`. Record credentials location in HANDOFF.md (values only in `.env.local`).
- [ ] C8. Gate: `bunx convex run` a tiny query (or dashboard check) shows 2 users + 3 studios. Handoff commit `"feat: convex schema, session helper, overlap guard, seed"`.

## Phase D: auth API (trust boundary: apply security always-on rules, focused review at the end of the phase)

Design (from research; Convex Auth is beta and cookie-bound, NOT used): passwords hashed with `node:crypto` scrypt inside route handlers (Vercel Node runtime), `timingSafeEqual` comparison, salt per user, format `scrypt$N$r$p$salt$hash` in `src/lib/passwords.ts`. Login generates a 32-byte random token (base64url); its sha-256 goes to the sessions table (TTL 7 days); the raw token returns once to the client. Protected route handlers extract the bearer token and pass it as an ordinary argument to Convex functions, which validate via `requireSession`.

Checker-first order for EVERY endpoint in D and E:
1. Write the Python test in `tests/testsprite/backend/` asserting the CONTRACT (read API_CONTRACT.md for the exact codes).
2. `testsprite test create ... --run --wait`: expect RED (endpoint missing = 404). Append the RED line to LOOP.md.
3. Implement. `bun run build` green. Handoff push. Poll `/api/health` until `commit` equals the new short sha (deploy is live).
4. `testsprite test rerun <id> --wait`: GREEN. Append the GREEN line to LOOP.md. Handoff commit for LOOP.md (and any fix).
5. If the rerun is RED for a reason you did not predict: that is a REAL caught bug, the most valuable thing in this hackathon. `test failure summary`, fix the root cause, rerun, and log every round honestly.

- [ ] D1. `POST /api/auth/register` + `POST /api/auth/login` + `GET /api/me` + `POST /api/auth/logout` per contract. Tests: happy paths; wrong password 401; duplicate email 409 EMAIL_TAKEN; token works on /api/me; logout kills the token (subsequent /api/me = 401). Convex functions: `users.createUser`, `users.getAuthMaterialByEmail` (returns hash material only), `sessions.createSession`, `sessions.deleteSession`, `users.getMe`.
- [ ] D2. Focused security review of the phase: no password or hash in any response or log; identical 401 message for unknown email vs wrong password; tokens never logged; rate limiting is OUT of scope (note it in EVIDENCE.md as a known limitation).
- [ ] D3. Gate: 4+ green banked tests covering D1. LOOP.md updated per iteration. HANDOFF.md updated.

## Phase E: booking engine API (the core; most LOOP.md iterations happen here)

Build in THIS order (each step = checker-first loop per the D procedure; every error path in the contract gets an assertion in some test):

- [ ] E1. Studios: GET list, GET by slug, admin POST/PATCH/DELETE. Tests include: member POST studios = 403 FORBIDDEN; anonymous = 401.
- [ ] E2. Availability: GET with from/to; statuses free/booked/blackout/past correct; range cap 14 days = VALIDATION_ERROR; expired hold shows free.
- [ ] E3. Holds: POST happy path 201 with expiresAt = now + HOLD_TTL_SECONDS*1000; misaligned times 400; past slot 422 SLOT_IN_PAST; outside open hours 422; conflict with existing active hold 409 SLOT_CONFLICT; same-user same-slot re-request returns 200 with the SAME hold id; DELETE releases.
- [ ] E4. Bookings: confirm from hold 201 with reference `ATL-XXXXXX`; double-confirm returns 200 SAME booking (idempotency test); expired hold 410 HOLD_EXPIRED (use `POST /api/internal/expire-holds` with the `x-internal-key` header after creating a hold with a short TTL via env, or set HOLD_TTL_SECONDS low in a dedicated test scenario per API_CONTRACT.md endpoint 22); foreign hold 403; unknown 404.
- [ ] E5. THE INVARIANT TEST (make it a named, prominent test: judges should see it): create hold A + confirm; then attempt overlapping holds at exact same slot, partial overlap left, partial overlap right, contained, containing: ALL must 409. Then cancel and verify the slot frees.
- [ ] E6. Cancellation + waitlist: cancel inside window 204; under cutoff 403 OUTSIDE_CANCEL_WINDOW; admin bypass works; waitlist join on full slot 201 with position; join on free slot 409 SLOT_NOT_FULL; duplicate 409 ALREADY_WAITLISTED; cancellation promotes oldest waiting entry into an ACTIVE hold with fresh TTL (assert via availability + the promoted user confirming successfully).
- [ ] E7. Blackouts: admin POST covering an existing booking cancels it and releases holds (assert response counts); non-admin 403.
- [ ] E8. Chained suite: wire `--produces/--needs` across create-studio, hold, booking, teardown (`--category teardown` deletes what tests created) so `test run --all` is wave-ordered and self-cleaning. Gate: `testsprite test run --all --project <ID> --wait` fully green, twice in a row (proves determinism and cleanup).
- [ ] E9. Expected volume by end of E: 15-20 banked backend tests, 15+ LOOP.md iterations including at least a few REAL caught bugs (they will happen; log them with pride, they are worth 40 points).

## Phase F: premium UI

- [ ] F1. BEFORE any component: invoke the design-motion skill (router, then playbook + SKILL_UI), fill the per-project token sheet. The product voice: calm, precise, studio-craft. Dark, warm, gallery-like. This is a "major new surface": the playbook may route to the Claude Design loop; if the human is unavailable for that loop, hand-build with SKILL_UI.
- [ ] F2. Pages (all data via the REST API or server components calling the same Convex functions; keep route handlers the single behavior source): `/` (hero + studio gallery), `/studios/[slug]` (detail + availability grid + booking wizard), `/dashboard` (bookings, holds with live TTL countdown, waitlist), `/admin` (studios CRUD, blackouts, override cancel), `/login` + `/register`, `/loop` (renders LOOP.md from the repo, styled; read the file at build/deploy time).
- [ ] F3. `data-testid` inventory (REQUIRED, frontend tests depend on these exact ids): `studio-card-<slug>`, `slot-<startTs>`, `hold-confirm-btn`, `booking-confirmation`, `booking-reference`, `login-email`, `login-password`, `login-submit`, `login-error`, `waitlist-join-btn`, `waitlist-position`, `admin-blackout-form`, `cancel-booking-btn`. Add them as components are written, never after.
- [ ] F4. The booking wizard MUST end on a distinct confirmation screen showing `booking-reference` (the canonical TestSprite frontend assertion target).
- [ ] F5. Gate: design-motion gate passed; `bun run build` green; every page renders with seeded data on the live URL; no `useEffect` without a named external system; handoff pushed and deployed.

## Phase G: frontend TestSprite tests (credits are finite: create once, run once green)

- [ ] G1. Create the frontend project NOW (needs seeded member credentials): `testsprite project create --type frontend --name atelier-web --url https://atelier-studios-opal.vercel.app --username member@atelier.test --password <from .env.local>`.
- [ ] G2. Four plans in `tests/testsprite/frontend/` (JSON shape in TESTSPRITE_CLI.md), one behavior each, 1-2 assertions at the end: (1) full booking wizard to `booking-confirmation` visible + reference text present; (2) login failure shows `login-error`; (3) waitlist join on a full slot shows `waitlist-position`; (4) admin creates a blackout and the slot grid shows it blocked. Keep steps outcome-oriented, one verb per step.
- [ ] G3. Create + run each once (`--run --wait`). Fix red the checker-first way (LOOP.md lines). Reruns of PASSING plans are free; new/changed frontend runs cost credits, so do not iterate stylistically here.
- [ ] G4. Gate: 4 green frontend tests banked. LOOP.md updated.

## Phase H: CI/CD gate (+5 points)

- [ ] H1. `.github/workflows/testsprite.yml`, exactly this shape (adjust project ids):
   ```yaml
   name: testsprite
   on: pull_request
   env:
     TESTSPRITE_API_KEY: ${{ secrets.TESTSPRITE_API_KEY }}
     BACKEND_PROJECT_ID: <backend-project-id>
   jobs:
     verify:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 22 }
         - run: npm i -g @testsprite/testsprite-cli
         - run: >
             testsprite test run --all --project "$BACKEND_PROJECT_ID"
             --wait --output json
             --idempotency-key "ci-${{ github.run_id }}-${{ github.run_attempt }}"
             > result.json
         - if: failure()
           run: testsprite test failure get "$(jq -r '.run.testId' result.json)" --out ./.testsprite/failure --failed-only
         - if: failure()
           uses: actions/upload-artifact@v4
           with: { name: testsprite-failure, path: .testsprite/failure }
   ```
   Note: `--all` covers backend tests; that is the gate. (Frontend-in-CI would burn credits per push; document that choice in EVIDENCE.md.)
- [ ] H2. Human: add `TESTSPRITE_API_KEY` in GitHub repo Settings > Secrets and variables > Actions. STOP until confirmed.
- [ ] H3. Gate: open a trivial PR (human pushes a branch), the workflow runs green, screenshot for EVIDENCE.md. Merge.

## Phase I: hardening pass (pre-submission freeze: this TRIGGERS the full audit per `.claude/REFERENCE_SECURITY_AUDIT.md`)

- [ ] I1. Run the audit phases 0-9 scoped to `src/` and `convex/` (the codebase is small; focus: auth flows, token handling, role checks on every admin route, error envelope consistency, no secret leakage in errors/logs, input validation on every body/query param).
- [ ] I2. Fix findings by severity; each fix that touches behavior goes through the checker (rerun affected tests; new LOOP.md lines).
- [ ] I3. Gate: audit report written to `docs/hackathon/AUDIT.md`; `test run --all` green; frontend tests green (free verbatim replays).

## Phase J: evidence and README

- [ ] J1. Invoke the readme-craft skill BEFORE writing. README must contain: what Atelier is, the live URL, seeded demo credentials for judges (member account only, never admin), what the loop covered, THE EXACT REAL BUGS the loop caught (pull them from LOOP.md, name them specifically like PolyDub did), how to run the loop yourself, and the `/loop` page link.
- [ ] J2. `docs/hackathon/EVIDENCE.md`: test inventory table (id, name, what invariant it protects), dashboard screenshots (human captures them, agent lists exactly which: run history, all-green suite, one failure bundle), the CI screenshot from H3, LOOP.md statistics (iterations, reds, greens, bugs fixed).
- [ ] J3. Gate: readme-craft final gate passed; every claim in README verified against the live app RIGHT THEN.

## Phase K: submission (July 7, morning PDT; DO NOT wait for the afternoon)

- [ ] K1. Full checklist in SUBMISSION.md, line by line, checking every box.
- [ ] K2. Human submits the Google Form (https://forms.gle/oyraF8mHW2KfobJh8): live URL, repo, TestSprite account email (andy.luemba@protonmail.com: MUST match the account that ran the tests, it does), LOOP.md.
- [ ] K3. Human posts in the Discord submissions channel with the EXACT pinned template, and drops the repo link in the channel. Agent drafts both texts; human posts. STOP-AND-ASK applies: agent never posts.
- [ ] K4. Recheck the announcements channel for rule changes. Confirm the live URL responds. Done.

## Risk register

1. Vercel 404 persists after A1: check the build log with the human; fallback is a fresh Vercel project re-import (10 min).
2. CONVEX_DEPLOY_KEY delayed: Phases B and D route handlers can be written but not deployed against real data; prioritize chasing the human.
3. TestSprite credits run out (exit code 12): backend is free, so only frontend suffers; submit the boost form (link in OVERVIEW.md) TODAY; worst case ship 2 frontend tests instead of 4.
4. `bunx convex deploy` websocket issue: fall back to `npx convex deploy` (documented, supported).
5. Time collapse: the MINIMUM viable winning cut is: Phases A-E complete + a clean but simple UI for the booking wizard only + 2 frontend tests + CI + README/EVIDENCE. Cut admin UI first, never cut LOOP.md quality or the invariant tests.
6. Next 16 renamed middleware to proxy: we use NO middleware; if any doc suggests middleware.ts, refuse and use route-handler-level checks.

## Scoring self-check (before submitting, honestly)

- Loop Quality 40: 20+ LOOP.md lines, each with a platform run and a commit? Real bugs caught and named?
- Project Quality 40: live app premium, fast, working end to end with seeded data?
- Innovation 20+5: checker-first narrative visible in LOOP.md (red lines before green)? `/loop` page live? Failure bundles committed? CI green screenshot?
- Engagement: boost form sent, repo starred/shared, optional dev.to draft offered to the human.
