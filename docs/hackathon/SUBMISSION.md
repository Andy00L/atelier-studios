# Submission: deliverables, checklist, and process

Deadline: **July 7, 2026, 4:59 PM PDT**. Late = not counted. Everything below must be in place before that moment.

## Deliverables

### 1. In the GitHub repo (public)

| Item | Required | Detail |
|---|---|---|
| Source code | Yes | Public repo. Commit history is part of the proof the loop ran, so commits must be frequent and honest during the build. |
| LOOP.md | Yes | Agent-written, one plain-English line per iteration. Full format spec in [LOOP_PROTOCOL.md](LOOP_PROTOCOL.md). No log = invalid submission. |
| README | Yes | Must state what the app is, the live URL, and what the loop covered. When writing it, the readme-craft skill in `.claude/skills/readme-craft/` applies. |

### 2. Live deployment

| Item | Required | Detail |
|---|---|---|
| Public URL | Yes | Live for the whole build phase, still live at submission and through review (July 8-12). |

### 3. TestSprite platform

| Item | Required | Detail |
|---|---|---|
| Banked tests | Yes | The tests the loop created and passed live on the TestSprite platform under our account. Judges cross-check the platform run history against LOOP.md and commits. |
| Account match | Yes | The account named in the submission must be the one that generated those tests. |

### 4. Optional but ranked

| Item | Required | Detail |
|---|---|---|
| Demo video | No | Encouraged, linked in the Discord post. Explicitly stated to boost ranking. |
| CI/CD wiring | No | Worth +5 Innovation points. See LOOP_PROTOCOL.md. |
| Write-ups / polls / X shares | No | Unbounded engagement bonus. |

## Submission process (do both steps)

The official material is split between a form and a Discord channel (see the ambiguity note in OVERVIEW.md). The safe reading, taken from the most recent organizer post:

1. **Fill the Google Form**: https://forms.gle/oyraF8mHW2KfobJh8
   The form asks for: live URL, public repo, TestSprite account, LOOP.md, and confirmation that the entry follows the Season 3 rules.
2. **Post in the Discord submissions channel** (`#hackathon-s3-submissions`, opened June 30, 5:00 PM PDT), following the exact template pinned there: live URL, public repo link, TestSprite account, demo video optional. Also drop the repo link in the channel for community visibility.

Only entries that 100% follow the template count, per the channel title. Check the pinned template in the channel at submission time; do not reconstruct it from memory.

## Pre-submission checklist

Run through this list before the deadline:

- [ ] Repo is public.
- [ ] LOOP.md exists, is agent-written, one line per iteration, and matches the commit history and the TestSprite platform run history.
- [ ] README states the app, the live URL, and what the loop covered.
- [ ] Live URL responds right now and has been live through the build phase.
- [ ] Banked tests visible on the TestSprite platform under our account.
- [ ] The account in the form is the account that generated the tests.
- [ ] Following @test_sprite on X; Discord member with badge.
- [ ] Exactly one submission from us.
- [ ] Google Form submitted.
- [ ] Discord post made with the exact pinned template.
- [ ] (Optional) demo video linked; CI/CD workflow committed.
- [ ] Announcements channel rechecked for last-minute rule changes.

## Constraint from our own standards

Per this project's `.claude/CLAUDE.md`, the agent never runs git commands. The hackathon needs a real commit history as proof of the loop, so: after every loop iteration, the agent updates LOOP.md and the code, then prints the ready-to-run git block; the human commits immediately. Batching many iterations into one commit weakens the proof. Small, frequent, human-run commits are part of the strategy.
