// POST /api/auth/logout. sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 3).

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { bearerTokenFrom, apiError } from "@/lib/http";

export async function POST(request: Request) {
  const token = bearerTokenFrom(request);
  if (token === null) return apiError("UNAUTHORIZED", "Authentication required.");
  await fetchMutation(api.sessions.destroySession, { rawToken: token });
  return new NextResponse(null, { status: 204 });
}
