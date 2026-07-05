# TestSprite loop run evidence

Durable, committed proof that the loop ran. For every TestSprite CLI test run:

- `NN-<name>.json`: the CLI's JSON result for that run (verdict, runId, dashboardUrl).
- `transcript.log`: an appended, human-readable log of each CLI command and its result, in order.

The authoritative record also lives on the TestSprite platform under account
andy.luemba@protonmail.com (backend project `bdd79882-cb60-4618-87fb-f688c27cee41`),
where each run has a dashboard page; frontend tests additionally have a recorded
video (videoUrl), linked from docs/hackathon/EVIDENCE.md.
