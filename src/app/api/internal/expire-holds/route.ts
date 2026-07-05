// POST /api/internal/expire-holds. Forces lazy hold expiry for deterministic TTL
// tests. Guarded by a shared secret header, disabled when the secret is unset.
// sourceRef: docs/hackathon/API_CONTRACT.md (endpoint 22).

export const dynamic = "force-dynamic";

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { apiError, apiOk } from "@/lib/http";
import { internalTaskKey } from "@/lib/config";

export async function POST(request: Request) {
  const configuredKey = internalTaskKey();
  const providedKey = request.headers.get("x-internal-key");
  // Disabled unless a key is configured; constant behavior avoids leaking config.
  if (configuredKey === undefined || providedKey !== configuredKey) {
    return apiError("UNAUTHORIZED", "Authentication required.");
  }
  const result = await fetchMutation(api.internal.expireDueHolds, {});
  return apiOk({ expired: result.expired });
}
