// Browser-side API client. Calls the same-origin REST API and returns
// discriminated results (errors as values). sourceRef: docs/hackathon/API_CONTRACT.md.

import type { ApiError } from "./types";

export type ApiResult<PayloadType> =
  | { ok: true; data: PayloadType }
  | { ok: false; status: number; error: ApiError };

type RequestOptions = {
  token?: string | null;
  body?: unknown;
};

// One request helper. 204 responses resolve to { ok: true, data: null }.
export async function apiRequest<PayloadType>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<PayloadType>> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.token) headers["authorization"] = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    return { ok: false, status: 0, error: { code: "NETWORK_ERROR", message: "Could not reach the server." } };
  }

  if (response.status === 204) {
    return { ok: true, data: null as PayloadType };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorPayload = payload as { error?: ApiError } | null;
    const error = errorPayload?.error ?? { code: "UNKNOWN", message: "Something went wrong." };
    return { ok: false, status: response.status, error };
  }

  return { ok: true, data: payload as PayloadType };
}
