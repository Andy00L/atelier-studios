# TestSprite CLI reference (v0.2.0, verified July 5, 2026)

Condensed from docs.testsprite.com/cli and the installed CLI. Every build session uses this file instead of re-researching. The CLI is installed globally in WSL via Bun; ALWAYS prefix commands with the PATH export:

```bash
wsl -e bash -lc "export PATH=\$HOME/.bun/bin:\$PATH && cd ~/testsprite && testsprite <command>"
```

Auth is already configured (profile default, account andy.luemba@protonmail.com). Verify with `testsprite auth status`. Check credits with `testsprite usage`.

## Core concepts

- Project (frontend targets a public URL; backend targets an API base URL) > Tests (stable ids) > Runs (stable runId, verdict, artifacts, dashboardUrl).
- Two test types. Frontend: JSON plan of browser steps (navigate, click, fill, assert), executed in a real cloud browser. Backend: a Python (pytest-style) or TS/JS code file calling the API and asserting on responses, executed in a cloud sandbox.
- The CLI never tests localhost. Target = the deployed Vercel URL.
- CREDITS: fresh frontend runs cost credits; backend runs are FREE; a verbatim frontend replay that passes is free. Iterate hard on backend, be frugal with frontend runs.
- Exit codes: 0 pass; 1 fail/blocked; 3 auth; 4 not found; 5 validation; 6 conflict; 7 timeout; 10 transport (retry ok); 11 rate limited; 12 out of credits.

## Commands that matter here

Project:

```bash
testsprite project create --type backend --name atelier-api --url https://atelier-studios-opal.vercel.app
testsprite project create --type frontend --name atelier-web --url https://atelier-studios-opal.vercel.app --username <test-email> --password <test-password>
testsprite project list --output json
```

Create tests:

```bash
# backend: code file (Python), optional chaining metadata
testsprite test create --project <ID> --type backend --name "<name>" --code-file tests/testsprite/backend/<file>.py --run --wait --timeout 600
# chaining flags when a test produces or consumes shared values: --produces var --needs var, cleanup: --category teardown

# frontend: JSON plan
testsprite test create --project <ID> --type frontend --name "<name>" --plan-from tests/testsprite/frontend/<file>.json --run --wait --timeout 600
```

Run / rerun:

```bash
testsprite test run <test-id> --wait --timeout 600 --output json
testsprite test run --all --project <ID> --wait          # backend tests only, wave-ordered
testsprite test rerun <test-id> --wait                    # rerun after a fix
testsprite test list --project <ID> --output json
```

Diagnose a failure (in this order):

```bash
testsprite test result <test-id> --include-analysis
testsprite test failure summary <test-id>    # one screen: failureKind, rootCauseHypothesis, recommendedFixTarget
testsprite test failure get <test-id> --out .testsprite/failures/<test-id>/ --failed-only
```

Edit an existing test:

```bash
testsprite test code get <test-id>                                  # backend source
testsprite test code put <test-id> --code-file <file> --force
testsprite test plan put <test-id> --steps <steps.json>             # frontend plan
```

## Frontend plan JSON shape

```json
{
  "projectId": "<frontend-project-id>",
  "type": "frontend",
  "name": "Booking wizard reaches confirmation",
  "planSteps": [
    { "action": "navigate", "value": "https://atelier-studios-opal.vercel.app/studios" },
    { "action": "click", "selector": "[data-testid='studio-card-first']" },
    { "action": "fill", "selector": "[data-testid='login-email']", "value": "<test email>" },
    { "action": "assert", "selector": "[data-testid='booking-confirmation']", "condition": "visible" }
  ]
}
```

Rules: one action per step, stable `data-testid` selectors, 1-2 assertions at the end on content that proves the outcome. Plan max 200 steps / 256 KB. Batch create: `test create-batch --plan-from-dir dir/` (max 50).

## Backend test shape (Python)

A standalone script/pytest file that makes real HTTP calls to the deployed API and asserts. Keep each file self-contained: base URL constant at the top, helper for login to get a token, requests calls, plain asserts with messages. Store every file in `tests/testsprite/backend/` and commit it (judge-facing evidence).

## The loop, mechanically (one iteration)

1. Write or update the test file locally. Create it on the platform (`test create ... --run --wait`) or rerun the existing id.
2. RED: exit code 1. Run `test failure summary <id>`, then `test failure get <id> --out .testsprite/failures/<id>/ --failed-only` if more detail is needed.
3. Fix the root cause in the code. `bun run build` must pass locally.
4. Print the git handoff (starts with `cd ~/testsprite`); the human commits and pushes; Vercel deploys (~1-2 min).
5. Confirm the new deploy is live (see the commit marker technique in BUILD_PLAN.md), then `test rerun <id> --wait`.
6. GREEN: append the LOOP.md line (see LOOP_PROTOCOL.md format), print the LOOP.md git handoff.

## CI (GitHub Actions), for the +5 points

```bash
testsprite test run --all --project "$PROJECT_ID" --wait --output json > result.json   # backend suite
# frontend tests: loop over ids from `test list --output json` and run each by id
```

Auth in CI: `TESTSPRITE_API_KEY` env var from a GitHub secret. Rate limits: 60 runs/min per key; use --idempotency-key "ci-${{ github.run_id }}-${{ github.run_attempt }}". Full workflow in BUILD_PLAN.md Phase 6.

## Platform dashboard

Every run is banked under the account with run history and a dashboardUrl per run. Judges cross-check LOOP.md lines against this history: never log an iteration that has no matching platform run.
