/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as availability from "../availability.js";
import type * as blackouts from "../blackouts.js";
import type * as bookings from "../bookings.js";
import type * as holds from "../holds.js";
import type * as internal_ from "../internal.js";
import type * as lib_ids from "../lib/ids.js";
import type * as lib_overlap from "../lib/overlap.js";
import type * as lib_rules from "../lib/rules.js";
import type * as lib_sessions from "../lib/sessions.js";
import type * as lib_time from "../lib/time.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as studios from "../studios.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  availability: typeof availability;
  blackouts: typeof blackouts;
  bookings: typeof bookings;
  holds: typeof holds;
  internal: typeof internal_;
  "lib/ids": typeof lib_ids;
  "lib/overlap": typeof lib_overlap;
  "lib/rules": typeof lib_rules;
  "lib/sessions": typeof lib_sessions;
  "lib/time": typeof lib_time;
  seed: typeof seed;
  sessions: typeof sessions;
  studios: typeof studios;
  users: typeof users;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
