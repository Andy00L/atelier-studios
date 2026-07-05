# Season 3 Official Rules (condensed, complete)

Source: pinned posts in the Discord channel `#hackathon-rules-and-announcements` (June 22-23, 2026) and https://www.testsprite.com/hackathon-s3. This file restates every rule that affects us; nothing here is invented.

## Eligibility

- Follow TestSprite on X (https://x.com/test_sprite) AND be a member of the Discord server with the server badge next to your name. Submissions posted only on X do not count.
- 18 or older (or age of majority where you live) to participate and receive a prize.
- Prizes cannot be awarded where prohibited by law. Entrants in comprehensively sanctioned regions (including Iran, North Korea, Cuba, Syria, and the Crimea, Donetsk, and Luhansk regions) are not eligible to win because payouts cannot be sent there.

## Entry limits and teams

- One submission per person or team. Multiple submissions from the same person or team = disqualification.
- No limit on team size. All team members must be listed in the submission. One designated member submits for the group.

## Mandatory: the TestSprite CLI as checker

- The open-source TestSprite CLI must be genuinely used as the checker, not just installed.
- Run a real loop against the live app: create and run a test, pull the failure bundle when it breaks, fix, rerun.
- A single one-shot run is not a loop.
- The tests the loop banks live on the TestSprite platform under our account.
- Requires Node 20 or newer and a TestSprite account. The Discord announcement says free credits are enough to start; the landing page says paid plan via promo code (see the ambiguity note in OVERVIEW.md). Credit boost form: https://forms.gle/VQqpWk2LRDhjYgHF9

## Mandatory: public URL for the whole build phase

- The CLI runs tests in the cloud against the live app. It does not test localhost.
- The app must be reachable at a public URL throughout the build phase (June 30 to July 7), not just at submission time.
- Deploy early. Suggested by the organizers: Vercel, Render, Railway, Fly, or a tunnel.
- Frontend, backend, or full-stack; new or existing projects are all welcome.

## Mandatory: account consistency

- The TestSprite account named in the submission must be the same account that generated the banked tests in the project. A mismatch = disqualification.

## Intellectual property and content

- Everything submitted must be original work or work we have the rights to use.
- We retain ownership of the project; submitting does not transfer it to TestSprite.
- By submitting, we grant TestSprite permission to share, feature, and reference the project (repo, demo video, name/handle) in their marketing, with credit.
- Submissions must not contain illegal, malicious, infringing, harmful, or deceptive content (including malware). Server community guidelines apply throughout the event.

## Disqualification triggers (full list)

1. Multiple submissions from the same person or team.
2. TestSprite account mismatch (submitting account differs from the account that generated the banked tests).
3. Missing LOOP.md (explicitly named as a ground; also "No log = invalid submission" on the landing page).
4. Cheating, fraud, automation abuse, or misrepresentation.
5. Rule violations, prohibited content, or community-guideline violations.
6. Eligibility that cannot be verified (prize may be withheld).

## Prizes and payment

- Project Awards: $3,000 total, 5 winners (our track).
- CLI Improvement Bonus: $2,000 shared pool, $100 or more per merged PR, standing bounty with no end date, separate from judging. Not our track. PRs would be contributed under the CLI's Apache 2.0 license; trivial or padded PRs do not qualify.
- Prizes paid via Stripe, PayPal, or bank transfer. Winners are contacted by Discord DM for their preferred method. TestSprite is not responsible for recipient-side fees or delays.

## Administration

- Judges' decisions are final.
- TestSprite may change rules, dates, or prizes, or suspend or cancel the event, at any time; material changes are announced in the Discord server. Recheck the announcements channel before submitting.
- Data provided (TestSprite account email and name, repo, build details) is used to administer the event per https://www.testsprite.com/privacy
- Governing law: State of Delaware, USA. Disputes go to state or federal courts in King County, Washington.

## Bonus engagement points (unbounded, affects ranking)

- Participate in Discord polls when they drop.
- Be active in the hackathon chat (helping others, sharing feedback).
- Share the build journey on X, dev.to, or Medium. Long-form write-ups about the loop are explicitly called out as scoring major bonus points.
