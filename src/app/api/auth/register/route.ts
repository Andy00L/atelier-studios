// POST /api/auth/register. sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 1).

export const dynamic = "force-dynamic";

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { hashPassword } from "@/lib/passwords";
import { readJsonObject, readString, failure } from "@/lib/api";
import { apiError, apiOk, serverError } from "@/lib/http";

// Minimal email shape check: one @, a dot in the domain. Full validation is the
// mail server's job; this only rejects obviously malformed input.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  const parsed = await readJsonObject(request);
  if (!parsed.ok) return apiError("VALIDATION_ERROR", "Body must be a JSON object.");

  const email = readString(parsed.body, "email");
  const password = readString(parsed.body, "password");
  const name = readString(parsed.body, "name");
  if (email === undefined || password === undefined || name === undefined || name.trim().length === 0) {
    return apiError("VALIDATION_ERROR", "email, password, and name are required.");
  }
  if (!EMAIL_PATTERN.test(email)) {
    return apiError("VALIDATION_ERROR", "email is not a valid address.");
  }

  const hashed = await hashPassword(password);
  if (!hashed.ok) {
    if (hashed.reason === "too_short") {
      return apiError("VALIDATION_ERROR", "password must be at least 8 characters.");
    }
    return serverError();
  }

  const result = await fetchMutation(api.users.createUser, {
    email,
    passwordHash: hashed.encoded,
    name: name.trim(),
  });
  if (!result.ok) return failure(result.reason);
  return apiOk(result.user, 201);
}
