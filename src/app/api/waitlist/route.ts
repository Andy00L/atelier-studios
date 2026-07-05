// GET /api/waitlist (own entries) and POST /api/waitlist (join).
// sourceRef: docs/hackathon/API_CONTRACT.md (endpoints 16-17).

export const dynamic = "force-dynamic";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { asId, failure, readJsonObject, readNumber, readString } from "@/lib/api";
import { bearerTokenFrom, apiError, apiOk } from "@/lib/http";

export async function GET(request: Request) {
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");
  const result = await fetchQuery(api.waitlist.listMine, { sessionToken: token });
  if (!result.ok) return failure(result.reason);
  return apiOk(result.entries);
}

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
    const result = await fetchMutation(api.waitlist.join, {
      sessionToken: token,
      studioId: asId<"studios">(studioId),
      startTs,
      endTs,
    });
    if (!result.ok) return failure(result.reason);
    return apiOk({ id: result.id, position: result.position }, 201);
  } catch {
    return apiError("NOT_FOUND", "No studio with that id.");
  }
}
