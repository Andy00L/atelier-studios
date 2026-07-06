// POST /api/auth/login. sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 2).
// The same 401 is returned for an unknown email and a wrong password so the
// endpoint never reveals which accounts exist.

export const dynamic = "force-dynamic";

import { randomBytes } from "node:crypto";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { verifyPassword } from "@/lib/passwords";
import { SESSION_TTL_SECONDS } from "@/lib/config";
import { readJsonObject, readString } from "@/lib/api";
import { apiError, apiOk, serverError } from "@/lib/http";

const TOKEN_BYTES = 32;

// A valid scrypt hash of a throwaway value (not a secret). When the email is
// unknown, the route still runs one scrypt against this so an unknown email and a
// wrong password take the same time, closing the email-enumeration timing channel.
// sourceRef: docs/hackathon/AUDIT.md (finding SEC-1).
const DUMMY_PASSWORD_HASH =
  "scrypt$16384$8$1$Lhbv4YAOBBW6/ZbyKEpA2A==$0sKiL5ZX+FswzVheDu71cwV/3GVEzlOa/hE6eyyRNr2FLQOcM6ew6qFXQS0SWKkukH6WwenhKdPHcvz3DENc0g==";

export async function POST(request: Request) {
  const parsed = await readJsonObject(request);
  if (!parsed.ok) return apiError("VALIDATION_ERROR", "Body must be a JSON object.");
  const email = readString(parsed.body, "email");
  const password = readString(parsed.body, "password");
  if (email === undefined || password === undefined) {
    return apiError("VALIDATION_ERROR", "email and password are required.");
  }

  const material = await fetchQuery(api.users.getAuthMaterialByEmail, { email });
  if (material === null) {
    // Burn an equivalent scrypt so timing does not reveal that the email is unknown.
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return apiError("UNAUTHORIZED", "Invalid email or password.");
  }

  const verified = await verifyPassword(password, material.passwordHash);
  if (!verified.ok) return serverError();
  if (!verified.valid) {
    return apiError("UNAUTHORIZED", "Invalid email or password.");
  }

  const rawToken = randomBytes(TOKEN_BYTES).toString("base64url");
  await fetchMutation(api.sessions.createSession, {
    userId: material.userId,
    rawToken,
    ttlSeconds: SESSION_TTL_SECONDS,
  });

  const user = await fetchQuery(api.users.getMe, { sessionToken: rawToken });
  if (user === null) return serverError();
  return apiOk({ token: rawToken, user });
}
