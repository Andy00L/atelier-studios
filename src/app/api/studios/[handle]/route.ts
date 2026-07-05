// GET /api/studios/{slug} (public), PATCH /api/studios/{id} and
// DELETE /api/studios/{id} (admin). The path segment is a slug for GET and a
// studio id for PATCH/DELETE. sourceRef: docs/hackathon/API_CONTRACT.md (6, 8, 9).

export const dynamic = "force-dynamic";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { asId, failure, readJsonObject, readNumber, readString, readStringArray } from "@/lib/api";
import { bearerTokenFrom, apiError, apiOk } from "@/lib/http";

type Context = { params: Promise<{ handle: string }> };

export async function GET(_request: Request, context: Context) {
  const { handle } = await context.params;
  const studio = await fetchQuery(api.studios.getBySlug, { slug: handle });
  if (studio === null) return apiError("NOT_FOUND", "No studio with that slug.");
  return apiOk(studio);
}

export async function PATCH(request: Request, context: Context) {
  const { handle } = await context.params;
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return apiError("VALIDATION_ERROR", "Body must be a JSON object.");

  try {
    const result = await fetchMutation(api.studios.update, {
      sessionToken: token,
      studioId: asId<"studios">(handle),
      name: readString(parsed.body, "name"),
      description: readString(parsed.body, "description"),
      equipment: readStringArray(parsed.body, "equipment"),
      hourlyPriceCents: readNumber(parsed.body, "hourlyPriceCents"),
      photoUrl: readString(parsed.body, "photoUrl"),
      openHour: readNumber(parsed.body, "openHour"),
      closeHour: readNumber(parsed.body, "closeHour"),
    });
    if (!result.ok) return failure(result.reason);
    return apiOk(result.studio);
  } catch {
    // A malformed id string is rejected by Convex; treat it as not found.
    return apiError("NOT_FOUND", "No studio with that id.");
  }
}

export async function DELETE(request: Request, context: Context) {
  const { handle } = await context.params;
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");
  try {
    const result = await fetchMutation(api.studios.softDelete, {
      sessionToken: token,
      studioId: asId<"studios">(handle),
    });
    if (!result.ok) return failure(result.reason);
    return new Response(null, { status: 204 });
  } catch {
    return apiError("NOT_FOUND", "No studio with that id.");
  }
}
