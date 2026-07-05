# Loop protocol: how the checker runs and how it is judged

This file tells any working session how to run the TestSprite loop correctly and what the judges score. Follow it during every build session on this project.

## The loop, as defined by the organizers

Four steps, one repeats:

1. **Write** (maker): the coding agent ships code.
2. **Verify** (checker): the TestSprite CLI runs real tests against the live app in the cloud and returns verdicts.
3. **Fix** (maker): the agent reads the failure bundle and fixes the root cause. Root cause, not symptom.
4. **Verify again** (checker): rerun. A pass banks on the TestSprite platform. Then back to the top.

Hard rules:

- The CLI tests the deployed public URL, never localhost. Deploy before looping.
- A single one-shot run is not a loop. The loop must repeat, catch real breakage, and fix it.
- Every banked test lives on the TestSprite platform under our account; judges read that run history.

## CLI setup (from the official quickstart)

1. Install the CLI from https://github.com/TestSprite/testsprite-cli (Node 20 or newer). The CI example uses `npm i -g @testsprite/testsprite-cli`.
2. Run `testsprite setup`: configures the API key and installs a verification skill into the coding agent so it knows when and how to run the checker.
3. Point the CLI at the deployed public URL.
4. Loop: create a test, run it, fix on failure, rerun. Full commands live in the repo README and https://docs.testsprite.com/cli/getting-started/overview (read those at build time; do not trust remembered flags).

## LOOP.md: the required log

LOOP.md is the first thing judges read. Rules from the organizers:

- **Agent-written, as the loop runs.** No hand-writing, no after-the-fact reconstruction.
- **One plain-English line per iteration**, maker first: which maker acted, what ran, what broke, what got fixed.
- It must be consistent with the commit history and the TestSprite platform run history; the three together are the proof.
- Missing LOOP.md = invalid submission (also listed as a disqualification ground).

Working format for each line (derived from "maker first, then what ran, what broke, what got fixed"):

```
N. [maker: Claude Code] Ran <test name/id> against <live URL page/endpoint>; <what failed and why>; fixed by <root-cause fix>; rerun passed and banked.
```

Session obligations:

- Append to LOOP.md in the same working step as the fix it describes, never in a later batch.
- Never invent, embellish, or backfill entries. An entry with no matching platform run or commit is worse than a missing entry: it reads as fraud, and fraud is a disqualification ground.
- Keep entries plain English and short; judges skim this file first.

## Judging rubric (Project Awards track)

Human judges, 100 points plus bonuses:

| Points | Criterion | What judges look at |
|---|---|---|
| 40 | Project Quality | Craft, completeness. Does the live app actually work well? |
| 40 | Loop Quality | Did a real loop run, and catch and fix real things? Read from LOOP.md, commits, and platform runs. |
| 20 | Innovation | Creativity of the project or of the loop design. |
| +5 | CI/CD | Wiring the checker into CI/CD. |
| Unbounded | Engagement | Discord polls, X shares, long-form write-ups about the loop. |

Strategic reading: Loop Quality is worth as much as Project Quality, and the track description says "judged on the loop, not polish or pitch". Time spent making the loop catch and fix real bugs scores as much as time spent on features.

## CI/CD wiring (+5 Innovation points, optional)

Gate a GitHub Actions pipeline on TestSprite: every push reruns the tests and a non-zero exit fails the build. One workflow file, one secret. Guide: https://docs.testsprite.com/cli/integrations/ci-cd

Official example (verify against the current guide before using; the project id and secret are placeholders):

```yaml
# .github/workflows/testsprite.yml
on: pull_request
env:
  TESTSPRITE_API_KEY: ${{ secrets.TESTSPRITE_API_KEY }}
  PROJECT_ID: proj_xxxxxxxx
steps:
  - run: npm i -g @testsprite/testsprite-cli
  - run: testsprite test run --all --project "$PROJECT_ID" --wait --output json
    # non-zero exit fails the build
  # --all runs backend tests; for frontend, pass a test-id
```

The API key goes in a GitHub Actions secret, never in the repo. This is a trust-boundary change, so the always-on security rules in `.claude/REFERENCE_SECURITY_AUDIT.md` apply when wiring it.

## Per-session working order

Every build session on this project, in order:

1. Load the standards (`.claude/CLAUDE.md` procedure) as usual.
2. Read this folder (`docs/hackathon/`) if not already in context.
3. Check that the public URL is live before starting any loop work.
4. Build or fix (maker step).
5. Run the checker via the TestSprite CLI against the live URL.
6. On failure: pull the failure bundle, fix the root cause, rerun.
7. Append the LOOP.md line(s) for what actually happened.
8. Print the git handoff block; the human commits immediately (frequent commits are part of the judged proof; the agent never runs git).
9. Repeat.
