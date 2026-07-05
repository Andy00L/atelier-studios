// DELETE /api/blackouts/{id} (admin). sourceRef: API_CONTRACT.md (20).

export const dynamic = "force-dynamic";

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { asId, failure } from "@/lib/api";
import { bearerTokenFrom, apiError } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");
  try {
    const result = await fetchMutation(api.blackouts.remove, {
      sessionToken: token,
      blackoutId: asId<"blackouts">(id),
    });
    if (!result.ok) return failure(result.reason);
    return new Response(null, { status: 204 });
  } catch {
    return apiError("NOT_FOUND", "No blackout with that id.");
  }
}
