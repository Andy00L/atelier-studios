// POST /api/blackouts (admin). sourceRef: docs/hackathon/API_CONTRACT.md (19).

export const dynamic = "force-dynamic";

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { asId, failure, readJsonObject, readNumber, readString } from "@/lib/api";
import { bearerTokenFrom, apiError, apiOk } from "@/lib/http";

export async function POST(request: Request) {
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return apiError("VALIDATION_ERROR", "Body must be a JSON object.");
  const studioId = readString(parsed.body, "studioId");
  const startTs = readNumber(parsed.body, "startTs");
  const endTs = readNumber(parsed.body, "endTs");
  const reason = readString(parsed.body, "reason");
  if (studioId === undefined || startTs === undefined || endTs === undefined || reason === undefined) {
    return apiError("VALIDATION_ERROR", "studioId, startTs, endTs, and reason are required.");
  }

  try {
    const result = await fetchMutation(api.blackouts.create, {
      sessionToken: token,
      studioId: asId<"studios">(studioId),
      startTs,
      endTs,
      reason,
    });
    if (!result.ok) return failure(result.reason);
    return apiOk(
      { id: result.id, releasedHolds: result.releasedHolds, cancelledBookings: result.cancelledBookings },
      201,
    );
  } catch {
    return apiError("NOT_FOUND", "No studio with that id.");
  }
}
