# Session handoff: current state of the hackathon build

Last updated: July 5, 2026 (planning session, before Phase 0). RULE FOR EVERY SESSION: update this file before ending work so the next session resumes without re-deriving anything.

## Read order for a fresh session

1. This file (current state, blockers, next action).
2. [PLAN.md](PLAN.md): the phase-by-phase execution plan and where we are in it.
3. [IDEA.md](IDEA.md): what we are building and why (includes the research findings).
4. [LOOP_PROTOCOL.md](LOOP_PROTOCOL.md): how every build iteration must run (checker, LOOP.md format, rubric).
5. [OVERVIEW.md](OVERVIEW.md), [RULES.md](RULES.md), [SUBMISSION.md](SUBMISSION.md): reread before submitting.

## Fixed decisions (do not reopen)

- Track: Project Awards only ($3,000, 5 winners). The CLI bounty track is out of scope.
- Project: **Atelier**, a multi-role reservation engine for creative studios (photo, music, podcast) with holds (TTL), waitlist, and a hard anti-double-booking invariant. Full spec in IDEA.md.
- GitHub repo: `atelier-studios`, remote already created by the human at https://github.com/Andy00L/atelier-studios.git (main branch).
- Stack: Next.js latest App Router + TypeScript + Bun (never npm/yarn/pnpm, never Vite), Supabase (Postgres + auth), deploy on **Vercel** (Railway/Render only as plan B).
- Loop strategy: checker-first development; backend TestSprite runs are free so the API suite carries the loop volume; frontend tests limited to 3-4 flows (they cost credits); target 10-15+ honest LOOP.md iterations.
- Innovation levers: checker-first red-then-green entries in LOOP.md, committed failure bundles, public `/loop` page rendering LOOP.md in the app, GitHub Actions gate (+5).

## Current status

- Planning is DONE (all docs in this folder).
- Phase 0 IN PROGRESS (July 5): Next.js 16.2.10 + React 19 + Tailwind v4 scaffolded at the repo root with Bun 1.3.14 (installed in WSL at `~/.bun/bin`; export PATH in non-interactive shells). `/api/health` route handler added (force-dynamic), metadata title set to Atelier, `.env.example` created, `.gitignore` fixed to keep `.env.example` and ignore `/.scratch/`. Production build passes (`bun run build` via `wsl -e bash -lc`).
- The scaffold generated `AGENTS.md` (Next 16 guidance: read `node_modules/next/dist/docs/` before writing Next code); root CLAUDE.md now imports it. The scaffold's own CLAUDE.md was deleted (it only contained the import).
- WARNING: as of the July 5 session, `~/testsprite` had NO `.git` directory: the human had not yet run the init block. The README.md at root is the create-next-app boilerplate; the real README comes at Phase 5 via readme-craft. The human should NOT run the `echo "# atelier-studios" >> README.md` line from GitHub's snippet (a README already exists).
- Remaining Phase 0 items: human runs git init + first push, Vercel import + deploy, `testsprite setup` + project create + first test (needs the API key), first LOOP.md entry.

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
