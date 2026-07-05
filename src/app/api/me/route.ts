// GET /api/me. sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 4).

export const dynamic = "force-dynamic";

import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { bearerTokenFrom, apiError, apiOk } from "@/lib/http";

export async function GET(request: Request) {
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");
  const user = await fetchQuery(api.users.getMe, { sessionToken: token });
  if (user === null) return apiError("UNAUTHORIZED", "Invalid or expired token.");
  return apiOk(user);
}
