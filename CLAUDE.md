# Project context: TestSprite Hackathon Season 3 entry

@AGENTS.md


This project is our entry in the TestSprite Hackathon Season 3 ("Build the Loop"), **Project Awards track only** ($3,000 pool, 5 winners, judged on the testing loop, not polish or pitch).

Before planning or building anything here, read the hackathon docs in `docs/hackathon/`:

- [HANDOFF.md](docs/hackathon/HANDOFF.md): READ FIRST, always: current state, fixed decisions, blockers, working conventions. Update it before ending every session.
- [PLAN.md](docs/hackathon/PLAN.md): the phase-by-phase execution plan.
- [IDEA.md](docs/hackathon/IDEA.md): what we are building (Atelier) and the research behind it.
- [OVERVIEW.md](docs/hackathon/OVERVIEW.md): the event, our track, timeline, links, known ambiguities.
- [RULES.md](docs/hackathon/RULES.md): official rules and every disqualification trigger.
- [SUBMISSION.md](docs/hackathon/SUBMISSION.md): deliverables and the two-step submission process.
- [LOOP_PROTOCOL.md](docs/hackathon/LOOP_PROTOCOL.md): how the TestSprite CLI loop runs, the LOOP.md format, judging rubric, per-session working order.

Hard constraints that shape every session:

- Deadline: July 7, 2026, 4:59 PM PDT.
- The TestSprite CLI is the mandatory checker; it tests a live public URL, never localhost.
- LOOP.md must be agent-written, one line per loop iteration, as the loop runs. Missing or fake entries disqualify us.
- Frequent human-run commits are part of the judged proof; the agent prints git handoff blocks after each iteration (the agent never runs git, per `.claude/CLAUDE.md`).

The global standards in `.claude/CLAUDE.md` remain the floor; these notes add to them and never relax them.
