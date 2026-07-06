# Security audit (pre-submission)

Triggered by the submission freeze and the auth/session trust boundary, per
`.claude/REFERENCE_SECURITY_AUDIT.md`. Scope: `src/` (route handlers, libs) and
`convex/` (functions). Date: July 6, 2026.

## Findings

| # | Severity | Status | Finding |
|---|---|---|---|
| SEC-1 | Medium | FIXED | Login email-enumeration timing side-channel |
| SEC-2 | Low | Documented | No application-level rate limiting on login/register |
| SEC-3 | Info | Accepted | Internal-endpoint key compared without a timing-safe function |

### SEC-1 (Medium, FIXED): login timing side-channel

`POST /api/auth/login` returned 401 immediately when the email was unknown, but
ran scrypt (slow) when the email existed and the password was wrong. The timing
gap let an attacker enumerate valid accounts. Fix: when the email is unknown, the
route now runs one scrypt against a fixed dummy hash before returning the same
401, equalizing the response time. sourceRef: src/app/api/auth/login/route.ts.
Re-verified with the "auth lifecycle" TestSprite test (unknown email and wrong
password both return 401).

### SEC-2 (Low, documented): no app-level rate limiting

Login and registration have no per-IP or per-account throttle, so brute force and
signup spam are not slowed at the application layer. Deliberately NOT mitigated
with account lockout, which would introduce a denial-of-service vector (an
attacker could lock a victim out). The correct place for this is an edge or WAF
layer (Vercel platform protections, or a rate-limit middleware) in a production
deployment. Recorded as a known limitation for the demo.

### SEC-3 (Info, accepted): internal key comparison

`POST /api/internal/expire-holds` compares the `x-internal-key` header to the
configured key with `!==`. The key is high-entropy and the endpoint is an
internal, test-only maintenance route that is disabled when the key is unset. The
timing risk is negligible; accepted.

## Verified sound (no change needed)

- Passwords: scrypt (N=16384, r=8, p=1), per-user salt, `timingSafeEqual` compare; the plaintext never reaches Convex; the hash never reaches the browser.
- Sessions: 32-byte random token; only its sha-256 is stored, computed inside Convex, so a leaked `sessions` row cannot be replayed without the token preimage; expiry checked on every use.
- No user enumeration by message: unknown email and wrong password return the identical 401 body.
- Authorization: every admin mutation (studios create/update/softDelete, blackouts create/remove, bookings list with `all=true`) checks `role === "admin"` inside Convex, so a direct call to the public deployment URL is equally gated.
- Ownership (IDOR-safe): holds.release, bookings.confirm, bookings.cancel, and waitlist.cancel all verify the caller owns the record (or is an admin where the contract allows).
- The anti-overlap invariant runs inside one serializable Convex mutation (check-then-insert is race-free).
- Secrets: none committed. CONVEX_DEPLOY_KEY and INTERNAL_TASK_KEY live in `.env.local` (gitignored) and Vercel env; TESTSPRITE_API_KEY is a GitHub Actions secret. The member demo password in the committed frontend plans is an intentionally public judge credential, not a secret.
- Errors: distinct code per failure mode; the generic 500 leaks nothing.

## Method

Read every file in `src/` and `convex/` in full, traced each route handler to its
Convex function, checked the audit categories (money/assets, auth, validation,
error handling, resource management, IDOR, secrets). One real fix applied
(SEC-1), re-verified through the checker; two items documented honestly.
