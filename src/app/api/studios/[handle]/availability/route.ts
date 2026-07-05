// GET /api/studios/{id}/availability?from=&to= (public). The path segment is a
// studio id. sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 10).

export const dynamic = "force-dynamic";

import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { asId, failure } from "@/lib/api";
import { apiError, apiOk } from "@/lib/http";

type Context = { params: Promise<{ handle: string }> };

function parseEpochParam(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request, context: Context) {
  const { handle } = await context.params;
  const url = new URL(request.url);
  const from = parseEpochParam(url.searchParams.get("from"));
  const to = parseEpochParam(url.searchParams.get("to"));
  if (from === undefined || to === undefined) {
    return apiError("VALIDATION_ERROR", "from and to (epoch ms) are required.");
  }

  try {
    const result = await fetchQuery(api.availability.getForStudio, {
      studioId: asId<"studios">(handle),
      from,
      to,
    });
    if (!result.ok) return failure(result.reason);
    return apiOk({ slots: result.slots });
  } catch {
    return apiError("NOT_FOUND", "No studio with that id.");
  }
}
