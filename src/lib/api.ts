// Shared helpers for route handlers: map a Convex failure reason to the exact
// HTTP error the contract mandates, and read request bodies safely. sourceRef:
// docs/hackathon/API_CONTRACT.md.

import { NextResponse } from "next/server";
import { apiError, type ApiErrorCode } from "./http";
import type { Id, TableNames } from "@/convex/_generated/dataModel";

// A Convex Id is a branded string. URL path segments arrive as plain strings and
// are validated server-side by Convex; this is the documented boundary cast.
export function asId<Table extends TableNames>(value: string): Id<Table> {
  return value as Id<Table>;
}

// Every failure reason a Convex function can return, mapped to its contract
// error code and a specific, actionable message.
export type FailureReason =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "slot_conflict"
  | "slot_in_past"
  | "outside_open_hours"
  | "hold_expired"
  | "outside_cancel_window"
  | "slot_not_full"
  | "already_waitlisted"
  | "email_taken";

const REASON_TO_ERROR: Record<FailureReason, { code: ApiErrorCode; message: string }> = {
  unauthorized: { code: "UNAUTHORIZED", message: "Authentication required." },
  forbidden: { code: "FORBIDDEN", message: "You do not have access to this resource." },
  not_found: { code: "NOT_FOUND", message: "The requested resource does not exist." },
  validation: { code: "VALIDATION_ERROR", message: "The request body is invalid." },
  slot_conflict: { code: "SLOT_CONFLICT", message: "That time slot is no longer available." },
  slot_in_past: { code: "SLOT_IN_PAST", message: "That time slot is in the past." },
  outside_open_hours: {
    code: "OUTSIDE_OPEN_HOURS",
    message: "That time slot is outside the studio's open hours.",
  },
  hold_expired: { code: "HOLD_EXPIRED", message: "That hold has expired; start a new one." },
  outside_cancel_window: {
    code: "OUTSIDE_CANCEL_WINDOW",
    message: "This booking can no longer be cancelled.",
  },
  slot_not_full: { code: "SLOT_NOT_FULL", message: "That slot is available; book it instead." },
  already_waitlisted: {
    code: "ALREADY_WAITLISTED",
    message: "You are already on the waitlist for that slot.",
  },
  email_taken: { code: "EMAIL_TAKEN", message: "An account with that email already exists." },
};

// Build the contract error response for a Convex failure reason.
export function failure(reason: FailureReason): NextResponse {
  const mapped = REASON_TO_ERROR[reason];
  return apiError(mapped.code, mapped.message);
}

// Parse a JSON body, returning a failure when it is absent or malformed so the
// caller can respond with VALIDATION_ERROR instead of crashing.
export async function readJsonObject(
  request: Request,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false }> {
  try {
    const parsed = (await request.json()) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false };
    }
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return { ok: false };
  }
}

// Typed field readers: return the value when it matches the expected type, else
// undefined, so a handler can produce VALIDATION_ERROR before calling Convex.
export function readString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  return typeof value === "string" ? value : undefined;
}

export function readNumber(body: Record<string, unknown>, key: string): number | undefined {
  const value = body[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function readStringArray(body: Record<string, unknown>, key: string): string[] | undefined {
  const value = body[key];
  if (!Array.isArray(value)) return undefined;
  if (!value.every((item) => typeof item === "string")) return undefined;
  return value as string[];
}
