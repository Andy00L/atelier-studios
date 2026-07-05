// GET /api/bookings (list) and POST /api/bookings (confirm a hold).
// sourceRef: docs/hackathon/API_CONTRACT.md (endpoints 13-14).

export const dynamic = "force-dynamic";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { asId, failure, readJsonObject, readString } from "@/lib/api";
import { bearerTokenFrom, apiError, apiOk } from "@/lib/http";

export async function GET(request: Request) {
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");
  const all = new URL(request.url).searchParams.get("all") === "true";
  const result = await fetchQuery(api.bookings.list, { sessionToken: token, all });
  if (!result.ok) return failure(result.reason);
  return apiOk(result.bookings);
}

export async function POST(request: Request) {
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return apiError("VALIDATION_ERROR", "Body must be a JSON object.");
  const holdId = readString(parsed.body, "holdId");
  if (holdId === undefined) return apiError("VALIDATION_ERROR", "holdId is required.");

  try {
    const result = await fetchMutation(api.bookings.confirm, {
      sessionToken: token,
      holdId: asId<"holds">(holdId),
    });
    if (!result.ok) return failure(result.reason);
    // Confirming an already-converted hold returns the same booking with 200.
    return apiOk(result.booking, result.existing ? 200 : 201);
  } catch {
    return apiError("NOT_FOUND", "No hold with that id.");
  }
}
