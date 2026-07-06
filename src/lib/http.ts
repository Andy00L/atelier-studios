// HTTP response helpers enforcing the one error envelope used across the API.
// sourceRef: docs/hackathon/API_CONTRACT.md (Conventions). Every error code is
// declared here so a handler cannot invent an undocumented one.

import { NextResponse } from "next/server";

// The closed set of error codes. Adding a failure mode means adding a code here
// first, then using it. sourceRef: API_CONTRACT.md error table.
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "OUTSIDE_CANCEL_WINDOW"
  | "NOT_FOUND"
  | "SLOT_CONFLICT"
  | "SLOT_NOT_FULL"
  | "ALREADY_WAITLISTED"
  | "HOLD_EXPIRED"
  | "SLOT_IN_PAST"
  | "OUTSIDE_OPEN_HOURS"
  | "BEYOND_HORIZON"
  | "EMAIL_TAKEN";

// The HTTP status that must accompany each code. sourceRef: API_CONTRACT.md.
const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  OUTSIDE_CANCEL_WINDOW: 403,
  NOT_FOUND: 404,
  SLOT_CONFLICT: 409,
  SLOT_NOT_FULL: 409,
  ALREADY_WAITLISTED: 409,
  HOLD_EXPIRED: 410,
  SLOT_IN_PAST: 422,
  OUTSIDE_OPEN_HOURS: 422,
  BEYOND_HORIZON: 422,
  EMAIL_TAKEN: 409,
};

// Build the standard error response. The status is derived from the code so the
// two can never drift.
export function apiError(code: ApiErrorCode, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status: STATUS_BY_CODE[code] });
}

// Build a success response with an explicit status (defaults to 200).
export function apiOk<PayloadType>(data: PayloadType, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

// A 500 reserved for genuinely unexpected internal failures (for example a
// crypto subsystem error). Not part of the documented error table; the message
// stays generic so nothing sensitive leaks.
export function serverError(): NextResponse {
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
    { status: 500 },
  );
}

// Extract a bearer token from the Authorization header, or null if absent.
export function bearerTokenFrom(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header === null) {
    return null;
  }
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match === null ? null : match[1];
}
