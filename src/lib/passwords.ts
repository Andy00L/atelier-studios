// Password hashing and verification. Runs only in the Node.js runtime (route
// handlers on Vercel), never in the Convex runtime, which has no node:crypto
// scrypt. Convex stores and returns the opaque encoded string produced here.
// Errors are returned as values; nothing throws in this business logic.

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// scrypt cost parameters. N must be a power of two; these are standard
// interactive-login settings. sourceRef: node:crypto scrypt docs.
const SCRYPT_COST_N = 16384; // CPU/memory cost (2^14)
const SCRYPT_BLOCK_SIZE_R = 8;
const SCRYPT_PARALLELISM_P = 1;
const DERIVED_KEY_LENGTH_BYTES = 64;
const SALT_LENGTH_BYTES = 16;
const MIN_PASSWORD_LENGTH = 8;

// Encoded format, self-describing so parameters can evolve without breaking old
// hashes: scrypt$<N>$<r>$<p>$<saltBase64>$<hashBase64>.
const ENCODING_PREFIX = "scrypt";

type HashResult = { ok: true; encoded: string } | { ok: false; reason: "too_short" | "crypto_error" };
type VerifyResult = { ok: true; valid: boolean } | { ok: false; reason: "malformed_hash" | "crypto_error" };

function deriveKey(
  password: string,
  salt: Buffer,
): Promise<{ ok: true; key: Buffer } | { ok: false; reason: "crypto_error" }> {
  return new Promise((resolve) => {
    scrypt(
      password,
      salt,
      DERIVED_KEY_LENGTH_BYTES,
      { N: SCRYPT_COST_N, r: SCRYPT_BLOCK_SIZE_R, p: SCRYPT_PARALLELISM_P },
      (error, derivedKey) => {
        if (error) {
          resolve({ ok: false, reason: "crypto_error" });
          return;
        }
        resolve({ ok: true, key: derivedKey });
      },
    );
  });
}

// Hash a plaintext password into the encoded string stored by Convex.
export async function hashPassword(password: string): Promise<HashResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: "too_short" };
  }
  const salt = randomBytes(SALT_LENGTH_BYTES);
  const derived = await deriveKey(password, salt);
  if (!derived.ok) {
    return { ok: false, reason: "crypto_error" };
  }
  const encoded = [
    ENCODING_PREFIX,
    SCRYPT_COST_N,
    SCRYPT_BLOCK_SIZE_R,
    SCRYPT_PARALLELISM_P,
    salt.toString("base64"),
    derived.key.toString("base64"),
  ].join("$");
  return { ok: true, encoded };
}

// Verify a plaintext password against an encoded hash. A non-matching password
// is { ok: true, valid: false }; a malformed stored hash is a distinct failure.
export async function verifyPassword(password: string, encoded: string): Promise<VerifyResult> {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== ENCODING_PREFIX) {
    return { ok: false, reason: "malformed_hash" };
  }
  const salt = Buffer.from(parts[4], "base64");
  const expectedKey = Buffer.from(parts[5], "base64");
  const derived = await deriveKey(password, salt);
  if (!derived.ok) {
    return { ok: false, reason: "crypto_error" };
  }
  if (derived.key.length !== expectedKey.length) {
    return { ok: true, valid: false };
  }
  // Constant-time comparison to avoid leaking match progress via timing.
  const valid = timingSafeEqual(derived.key, expectedKey);
  return { ok: true, valid };
}
