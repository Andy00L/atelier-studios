# Session handoff: current state of the hackathon build

Last updated: July 6, 2026 (UI redesign integrated and verified end to end). RULE FOR EVERY SESSION: update this file before ending work so the next session resumes without re-deriving anything.

## Read order for a fresh session

1. This file (current state, blockers, next action).
2. [BUILD_PLAN.md](BUILD_PLAN.md): THE authoritative step-by-step plan with gates. Find the first unchecked gate; that is the next task. (PLAN.md is superseded background.)
3. [API_CONTRACT.md](API_CONTRACT.md): every endpoint, error code, business rule. Implementations and tests follow it exactly.
4. [TESTSPRITE_CLI.md](TESTSPRITE_CLI.md): exact CLI commands, credit rules, loop mechanics.
5. [IDEA.md](IDEA.md) and [LOOP_PROTOCOL.md](LOOP_PROTOCOL.md): product rationale and LOOP.md honesty rules.
6. [OVERVIEW.md](OVERVIEW.md), [RULES.md](RULES.md), [SUBMISSION.md](SUBMISSION.md): reread before submitting.

## Fixed decisions (do not reopen)

- Track: Project Awards only ($3,000, 5 winners). The CLI bounty track is out of scope.
- Project: **Atelier**, a multi-role reservation engine for creative studios (photo, music, podcast) with holds (TTL), waitlist, and a hard anti-double-booking invariant. Full spec in IDEA.md.
- GitHub repo: `atelier-studios`, remote already created by the human at https://github.com/Andy00L/atelier-studios.git (main branch).
- Stack: Next.js latest App Router + TypeScript + Bun (never npm/yarn/pnpm, never Vite), **Convex** (replaced Supabase on July 5, user decision; production deployment patient-ox-888, client URL https://patient-ox-888.convex.cloud, HTTP actions https://patient-ox-888.convex.site), deploy on **Vercel**: production URL https://atelier-studios-opal.vercel.app
- TestSprite account: andy.luemba@protonmail.com (the submitting account; CLI configured July 5 via `testsprite setup`, key stored in the CLI profile, never in the repo). Agent skills `testsprite-verify` and `testsprite-onboard` installed under `.claude/skills/`.
- Loop strategy: checker-first development; backend TestSprite runs are free so the API suite carries the loop volume; frontend tests limited to 3-4 flows (they cost credits); target 10-15+ honest LOOP.md iterations.
- Innovation levers: checker-first red-then-green entries in LOOP.md, committed failure bundles, public `/loop` page rendering LOOP.md in the app, GitHub Actions gate (+5).

## Current status

- Planning is DONE (all docs in this folder).
- Phase 0 IN PROGRESS (July 5): Next.js 16.2.10 + React 19 + Tailwind v4 scaffolded at the repo root with Bun 1.3.14 (installed in WSL at `~/.bun/bin`; export PATH in non-interactive shells). `/api/health` route handler added (force-dynamic), metadata title set to Atelier, `.env.example` created, `.gitignore` fixed to keep `.env.example` and ignore `/.scratch/`. Production build passes (`bun run build` via `wsl -e bash -lc`).
- The scaffold generated `AGENTS.md` (Next 16 guidance: read `node_modules/next/dist/docs/` before writing Next code); root CLAUDE.md now imports it. The scaffold's own CLAUDE.md was deleted (it only contained the import).
- WARNING: as of the July 5 session, `~/testsprite` had NO `.git` directory: the human had not yet run the init block. The README.md at root is the create-next-app boilerplate; the real README comes at Phase 5 via readme-craft. The human should NOT run the `echo "# atelier-studios" >> README.md` line from GitHub's snippet (a README already exists).
- July 5, later: human pushed the scaffold commit, imported the repo in Vercel (https://atelier-studios-opal.vercel.app), provided the TestSprite API key (CLI configured, account andy.luemba@protonmail.com), switched the database to Convex (deployment patient-ox-888). TestSprite CLI 0.2.0 installed globally in WSL.
- July 5, BACKEND BUILT AND LOCALLY VERIFIED (blocked-session work per risk register item 2): the entire Convex backend and all 22 REST endpoints are written, typecheck clean, `bun run build` green, and pass a 19-assertion local smoke test (`.scratch/smoke.mjs`) against an anonymous local Convex deployment. Verified locally: golden booking path, the anti-overlap invariant (409 SLOT_CONFLICT), idempotent re-hold and double-confirm, past/open-hours validation, auth probes (401/403), waitlist join and promotion-on-cancel. Files: `convex/` (schema, lib/, users, sessions, studios, availability, holds, bookings, waitlist, blackouts, internal, seed) and `src/app/api/**` + `src/lib/` (config, passwords, http, api).
- July 5 later: LIVE and looping. 5 backend TestSprite tests banked and passing (health, auth, invariant, authz/validation, waitlist), LOOP.md has 6 honest iterations (incl. a real caught test-runner bug), evidence in tests/testsprite/runs/.
- July 5 later: FULL PREMIUM UI built (design-motion skill applied; token sheet in docs/UI_DESIGN_SYSTEM.md). Dark warm gallery aesthetic. Pages: gallery (/), studio detail + booking wizard ending on a sealed confirmation (the hero), /login, /register, /dashboard, /admin, /loop (renders LOOP.md). Auth token in client memory (no localStorage, per standards). Build green, lint clean (3 accepted set-state-in-effect warnings; rule downgraded in eslint.config.mjs with justification). data-testid on every interactive element for the frontend tests.
- July 6: UI deployed and LIVE (all pages 200). Frontend TestSprite tests run (project 310cfc78-d7b7-4bc9-949b-6866c980735a): "Home gallery lists studios with rates" PASSED. Booking wizard and login-failure flows fully executed by the cloud browser and observed correct (real booking references ATL-7AP495/ATL-EA6855, exact login error), but TestSprite records them "blocked" (its frontend tester writes "Result: PASS / success=true" yet terminates via a blocked report). Documented honestly in LOOP.md 7-8; step observations + video URLs committed under tests/testsprite/runs/. This blocked-despite-PASS behavior is a candidate CLI-improvement bounty PR (separate track) if we want it later.
- July 6: CI wired (.github/workflows/testsprite.yml) gating pull_request on the backend suite. HUMAN TODO: add TESTSPRITE_API_KEY as a GitHub Actions secret (repo Settings > Secrets and variables > Actions), then open a PR to see it run (Phase H3).
- July 6: went all-in on quality. Added 3 more backend tests (admin CRUD, blackout, hold edges) all PASSED, so 8 backend green + LOOP.md now 11 iterations. Ran the security audit (docs/hackathon/AUDIT.md): found and FIXED SEC-1 (login email-enumeration timing side-channel), documented SEC-2/SEC-3. Wrote the README (readme-craft): icon (docs/assets/icon.svg), MIT LICENSE, mermaid architecture, banked-test table, honest mocks section. Captured real screenshots with Playwright (scripts/screenshots.mjs -> docs/screenshots/*.jpg, all <500KB); the booking flow completing in Playwright is extra proof the app works end to end. Design gate satisfied (looked at the real rendered gallery + sealed confirmation).
- July 6, UI REDESIGN (neutral near-black), integrated end to end via the Claude Design generate-and-integrate loop. The warm-brass look and the flat wax-seal (called out as amateur) are gone. New token sheet in `src/app/globals.css`: field `#0a0a0b`, one bone accent `#ece6d8`, an ivory studio **pass** (perforated ticket, debossed monogram, one specular sweep, cast shadow) as the hero object, a `#74c39a` confirm green reserved for the tick. Every screen rebuilt against the sheet: gallery (per-discipline aperture/waveform/mic glyphs), studio detail + the availability **light board** (select a slot, then Continue to review, with a live hold countdown), dashboard, split auth (the pass resting in soft light), admin, and the loop ledger. New shared components: `StudioArtwork`, `PassTicket`, `AuthScreen`, `PanelHeading`, `Skeleton`. `bun run build` green (24 routes). Verified END TO END on a local production build pointed at prod Convex with Playwright: signed in as the demo member, browsed live availability, held a slot, confirmed a REAL booking (ATL-9SVKMX), saw it on the dashboard, cancelled it. 7 gate screenshots refreshed under `docs/screenshots/` (01-gallery, 02-studio, 03-confirmation, 04-loop, 05-dashboard, 06-login, 07-hold; all <500KB) plus `docs/screenshots/testsprite-run.png`. Re-ran `testsprite test run --all`: 8/8 backend PASSED against the live URL (the redesign is frontend-only; the API contract the UI calls is unchanged). LOOP.md now has 15 iterations. The design source lives in the gitignored `docs/design/` (prompt pack + palette card) and `docs/.desgin/` (the Claude Design exports); consider adding `/docs/.desgin/` to `.gitignore` too (7.8MB of zips + PNGs).
- July 6, redesign DEPLOYED and looped on the live URL (health commit 3fb5ced; live gallery HTML carries the new `atl-card` markup). Re-authored the frontend booking plan for the new flow (select a slot, Continue to review, Confirm) and ran it in a real cloud browser via the CLI against the public URL: 11/11 steps passed, the tester observed "Booking confirmed" + reference ATL-DFLMWD and named the ivory pass; verdict recorded "blocked" (the known systemic frontend-tester artifact, logged honestly). Re-ran the backend suite: 8/8 PASSED. Evidence under `tests/testsprite/runs/frontend-booking-redesign*` (raw CLI logs, result.json/failure.json with the real testId/runId/dashboard/video URLs, and the `video.mp4` TestSprite recorded). Proof-of-run image is a REAL frame pulled from that video with ffmpeg at `docs/screenshots/testsprite-run-frame.jpg` (shows the live app confirmation with reference ATL-DFLMWD and the automated cloud-browser cursor). Note: an earlier hand-built HTML "terminal" mockup (`testsprite-run.png`) was removed because it was a styled recreation, not a genuine capture. LOOP.md now has 16 iterations. `/.testsprite/` (CLI cache) added to .gitignore.
- July 6, DEEPENED the frontend loop against the live URL (5 flows total now): booking (11/11), gallery (PASSED 4/4), waitlist join (PASSED 9/9, member waitlist cleared first for a clean join), login-failure (5/5, observed "Invalid email or password."), loop-page (2/2). Gallery and waitlist got clean `passed` verdicts; the other three completed every step but recorded `blocked` (the systemic frontend-tester artifact). Two real proof frames pulled from the run videos: `docs/screenshots/testsprite-run-frame.jpg` and `testsprite-login-error-frame.jpg`. Backend re-ran 8/8; `bun run build` green. Frontend evidence under `tests/testsprite/runs/frontend-*`.
- July 6, added register-success (8/8, PASSED) and admin-console (11/11, PASSED) frontend flows on the live URL. Frontend coverage is now SEVEN flows (booking, gallery, waitlist, login-failure, loop-page, register, admin); four have a clean `passed` verdict, three complete every step but record `blocked` (the systemic tester artifact). Plus eight backend tests green. LOOP.md now has 18 iterations. Plans under `tests/testsprite/frontend/`, logs under `tests/testsprite/runs/frontend-*`.
- July 6, POPULATED the UI with real testable interactions (to give the checker more surface): gallery client-side search + discipline filters + sort + result count (`StudioBrowser`, `StudioCard`); studio page save/share (`StudioActions`), Included-gear and Good-to-know sections, and a "Look inside" crafted lightbox gallery (`StudioGalleryStrip`); dashboard stats summary + Bookings/Waitlist tabs; landing How-it-works band + footer. Note the "Look inside" tiles are crafted gradient art in the house palette, not stock photography (kept honest and on-brand). `bun run build` green (24 routes); all interactions driven end to end with Playwright on a local prod build (new gate shots docs/screenshots/08-13). Authored three new frontend plans (gallery-filter, studio-lightbox, dashboard-tabs). LOOP.md now has 19 iterations. NEXT: the human commits + redeploys, then these three plans are run against the live URL (the current deploy 3fb5ced does not have the new interactions yet).
- AFTER NEXT PUSH: the login SEC-1 fix deploys; re-run the auth test to confirm login still works (`testsprite test rerun e81dea22-3b21-4a4e-ada8-d811596cfdef --wait`). Only timing changed, not responses.
- STILL TO DO: Phase K submit (Google Form https://forms.gle/oyraF8mHW2KfobJh8 + Discord post), and human: add TESTSPRITE_API_KEY GitHub secret then open a PR to show CI green. Deadline July 7 16:59 PDT. Optional polish: EVIDENCE.md (README already carries the test table), a demo video.
- BLOCKERS (still on the human):
  1. [RESOLVED July 5 ~22:15 UTC] The 404 was caused by Vercel Root Directory = `src`; cleared to empty. `/` and `/api/health` now return 200 (health commit d0e916e). Convex-backed endpoints (`/api/studios` etc.) return 500 until blocker 2 is done, because the Convex functions are not on prod yet.
  2. [RESOLVED July 5 ~23:00 UTC] CONVEX_DEPLOY_KEY provided. Convex functions deployed to prod (patient-ox-888) and seeded (3 studios, admin+member). NEXT_PUBLIC_CONVEX_URL set on Vercel + redeployed. Public URL FULLY WORKING: /api/studios and /api/auth/login return 200. The deploy key is in .env.local (gitignored). Demo passwords: admin@atelier.test / AdminPass#2026, member@atelier.test / MemberPass#2026 (throwaway demo creds; member goes in README for judges).
  - TestSprite backend project id: `bdd79882-cb60-4618-87fb-f688c27cee41`. First banked test "health endpoint" (testId 93bb4fb9) PASSED. LOOP.md started at repo root (iteration 1). Loop is now LIVE; next: Phase D/E checker-first tests.
  3. After deploy is green: seed production with `bunx convex run seed:seedDemo '{...hashes...}' --prod` (compute hashes with .scratch/hash.mjs; pick real passwords, put them and the seeded emails in .env.local and record where in this file).

## Local dev recipe (offline, for any session before the public URL is up)

Anonymous local Convex needs no account or key:

```bash
# start local Convex backend (keeps running; background it)
wsl -e bash -lc "export PATH=\$HOME/.bun/bin:\$PATH && cd ~/testsprite && export CONVEX_AGENT_MODE=anonymous && bunx convex dev"
# push + codegen + typecheck once, then exit:
#   bunx convex dev --once --typecheck try   (same CONVEX_AGENT_MODE=anonymous env)
# seed local:
#   bunx convex run seed:seedDemo "$(cat .scratch/seedargs.json)"
# run the app against local Convex, then the smoke test (all in ONE bash invocation
# so the process tree stays alive; nohup does NOT survive a wsl -e bash exit):
#   bun run start &  ... wait for /api/health 200 ... node .scratch/smoke.mjs
```

CRITICAL env note: `bunx convex dev` REWRITES `.env.local` to point `NEXT_PUBLIC_CONVEX_URL` at the LOCAL deployment (127.0.0.1:3210). That is correct for offline work and is gitignored. PRODUCTION uses the real patient-ox-888 URL, injected at Vercel build time by `convex deploy --cmd`; do not hardcode the local URL anywhere committed. Production deploy is selected by CONVEX_DEPLOY_KEY, never by the local `.env.local`.

## Blocking inputs still owed by the human (ask first thing)

1. TestSprite API key (their account must be the submitting account; needed for `testsprite setup`).
2. Supabase project: URL + anon key + service role key (env vars only, never committed).
3. Vercel: import of the GitHub repo `atelier-studios`, Supabase env vars added, production URL confirmed.
4. Recommended: submit the TestSprite credit boost form (link in OVERVIEW.md) because frontend runs consume credits.
5. Later (Phase 4): add `TESTSPRITE_API_KEY` as a GitHub Actions secret.

## Commits possibly still pending on the human side

If `git log` does not show them yet, hand these blocks back:

```bash
cd ~/testsprite
git add CLAUDE.md docs/hackathon/OVERVIEW.md docs/hackathon/RULES.md docs/hackathon/SUBMISSION.md docs/hackathon/LOOP_PROTOCOL.md docs/hackathon/IDEA.md docs/hackathon/PLAN.md docs/hackathon/HANDOFF.md
git commit -m "docs: hackathon rules, loop protocol, idea, execution plan, session handoff"
git push
```

## Working conventions (from user feedback and project standards)

- Every git handoff block starts with `cd ~/testsprite` (the project root in WSL; sessions run on Windows and reach it via `\\wsl.localhost\ubuntu\home\drew\testsprite`).
- The agent never runs any git command; the human commits after EVERY loop iteration (granular history is judged proof).
- Session start: run the standards proof from `.claude/CLAUDE.md` (list kit files, quote both H1s, name on-demand skills), then include the acknowledgement line in every reply.
- The user communicates in French; replies in French, all repo artifacts in English.
- No em dash (U+2014) or en dash (U+2013) anywhere, no banned words (list in `.claude/SKILL_GENERAL.md` section 8); grep before finishing any file.
- UI work triggers the design-motion skill (read router + playbook + SKILL_UI before components). README work triggers readme-craft.
- Scaffold warning (Phase 0): the project dir is non-empty (docs/, .claude/, README.md), and `create-next-app` refuses conflicting files. Scaffold in a temp subfolder and merge, preserving README.md and docs/.
- Build commands may need to run through WSL (`wsl -e bash -c "..."`) since the session shell is Windows and the tree lives in WSL; decide at Phase 0 and record the choice here.

## Deadline math

Submission closes July 7, 2026, 4:59 PM PDT. Phase 5 (evidence + submission) must be finished the morning of July 7. Everything in PLAN.md is sized to that.
