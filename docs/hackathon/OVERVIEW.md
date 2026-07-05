# TestSprite Hackathon Season 3: Build the Loop (Overview)

Read this file first. It is the entry point for everything about the hackathon this project is competing in. The other files in this folder go deeper:

- [RULES.md](RULES.md): the official rules and every disqualification trigger.
- [SUBMISSION.md](SUBMISSION.md): exactly what to deliver and where.
- [LOOP_PROTOCOL.md](LOOP_PROTOCOL.md): how the TestSprite CLI loop must run, the LOOP.md format, and the judging rubric.

## What the event is

TestSprite Hackathon Season 3, themed "Build the Loop". Season 3 runs on the open-source TestSprite CLI (not the MCP setup from Season 2). The core idea:

- The **maker** is your coding agent (Claude Code, Codex, etc.). It writes the code.
- The **checker** is the TestSprite CLI. It runs real tests in the cloud against your live, publicly deployed app and returns verdicts.
- The loop is: **write, verify, fix, verify again**. The agent reads the failure bundle, fixes the root cause, reruns. Passing tests bank on the TestSprite platform under your account.
- Organizer's warning, verbatim: "a loop with no real checker doesn't fail loudly. It hallucinates progress."
- A single one-shot test run is NOT a loop. The loop must run repeatedly and visibly.

## Our track

We are entering the **Project Awards track only**: $3,000 pool, 5 winners, best projects built with the CLI in a real testing loop. Judged on the loop, not polish or pitch.

The other track (CLI Improvement Bonus, $2,000 standing bounty for merged PRs to the CLI repo) is NOT our target. It exists, it is separate from judging, and it has no end date, but we are not pursuing it.

## Timeline (all times PDT)

| Date | Event |
|---|---|
| June 22-29, 2026 | Signups open |
| June 30, 5:00 PM | Build starts, submission channel opens |
| June 30 to July 7 | Build and loop phase (public URL must stay live the whole time) |
| **July 7, 4:59 PM** | **Submissions close (hard deadline)** |
| July 8-12 | Review |
| July 13 | Winners announced on X and Discord |

## Key links

- Event page: https://www.testsprite.com/hackathon-s3
- CLI repo (install, setup, quickstart): https://github.com/TestSprite/testsprite-cli
- CLI docs: https://docs.testsprite.com/cli/getting-started/overview
- CI/CD guide: https://docs.testsprite.com/cli/integrations/ci-cd
- Submission form: https://forms.gle/oyraF8mHW2KfobJh8
- Credit boost request form: https://forms.gle/VQqpWk2LRDhjYgHF9
- Discord server: https://discord.com/invite/GXWFjCe4an
- TestSprite on X: https://x.com/test_sprite
- Privacy policy: https://www.testsprite.com/privacy

## Non-negotiables at a glance

1. TestSprite CLI genuinely used as the checker (mandatory, not just installed).
2. App reachable at a public URL for the whole build phase (the CLI tests in the cloud, never localhost).
3. Public GitHub repo; commit history is part of the proof the loop ran.
4. Agent-written LOOP.md, one line per iteration. No LOOP.md = invalid submission.
5. README with the app description, live URL, and what the loop covered.
6. The TestSprite account submitted must be the same account that generated the banked tests.
7. One submission per person or team.
8. Node 20 or newer for the CLI.

## Known ambiguities in the official material

Record of conflicts between the announcements and the landing page, so no session re-derives them:

- **Credits vs paid plan**: the Discord announcement says a free account's credits are enough to get started, with a boost form for heavy use. The landing page checklist says "paid plan via promo code". Resolution path: use the boost form or ask in the Discord channel; do not assume either version.
- **Submission channel name**: announcements say `#hackathon-s3-submissions`, the landing page says `#hackathon-submissions`. Use whatever channel actually exists in the server.
- **Form vs channel**: the June 22 rules post says only submissions posted in the channel count; the submission-template post says everything goes through the Google Form and asks entrants to also drop the repo in the channel. Resolution: do BOTH (form first, then the Discord post). See SUBMISSION.md.
