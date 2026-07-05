// POST /api/holds. sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 11).

export const dynamic = "force-dynamic";

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { asId, failure, readJsonObject, readNumber, readString } from "@/lib/api";
import { bearerTokenFrom, apiError, apiOk } from "@/lib/http";
import { resolveHoldTtlSeconds } from "@/lib/config";

export async function POST(request: Request) {
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return apiError("VALIDATION_ERROR", "Body must be a JSON object.");
  const studioId = readString(parsed.body, "studioId");
  const startTs = readNumber(parsed.body, "startTs");
  const endTs = readNumber(parsed.body, "endTs");
  if (studioId === undefined || startTs === undefined || endTs === undefined) {
    return apiError("VALIDATION_ERROR", "studioId, startTs, and endTs are required.");
  }

  try {
    const result = await fetchMutation(api.holds.create, {
      sessionToken: token,
      studioId: asId<"studios">(studioId),
      startTs,
      endTs,
      ttlSeconds: resolveHoldTtlSeconds(),
    });
    if (!result.ok) return failure(result.reason);
    // An idempotent re-request of an existing hold returns 200, a fresh one 201.
    return apiOk(result.hold, result.existing ? 200 : 201);
  } catch {
    return apiError("NOT_FOUND", "No studio with that id.");
  }
}
