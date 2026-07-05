// GET /api/studios (public list) and POST /api/studios (admin create).
// sourceRef: docs/hackathon/API_CONTRACT.md (endpoints 5 and 7).

export const dynamic = "force-dynamic";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import {
  failure,
  readJsonObject,
  readNumber,
  readString,
  readStringArray,
} from "@/lib/api";
import { bearerTokenFrom, apiError, apiOk } from "@/lib/http";

export async function GET() {
  const studios = await fetchQuery(api.studios.listActive, {});
  return apiOk(studios);
}

export async function POST(request: Request) {
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return apiError("VALIDATION_ERROR", "Body must be a JSON object.");

  const name = readString(parsed.body, "name");
  const description = readString(parsed.body, "description");
  const equipment = readStringArray(parsed.body, "equipment");
  const hourlyPriceCents = readNumber(parsed.body, "hourlyPriceCents");
  const photoUrl = readString(parsed.body, "photoUrl");
  const openHour = readNumber(parsed.body, "openHour");
  const closeHour = readNumber(parsed.body, "closeHour");
  if (
    name === undefined ||
    description === undefined ||
    equipment === undefined ||
    hourlyPriceCents === undefined ||
    photoUrl === undefined ||
    openHour === undefined ||
    closeHour === undefined
  ) {
    return apiError("VALIDATION_ERROR", "Missing or invalid studio fields.");
  }

  const result = await fetchMutation(api.studios.create, {
    sessionToken: token,
    name,
    description,
    equipment,
    hourlyPriceCents,
    photoUrl,
    openHour,
    closeHour,
  });
  if (!result.ok) return failure(result.reason);
  return apiOk(result.studio, 201);
}
