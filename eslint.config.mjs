import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Convex codegen: not our source, ships its own eslint-disable header.
    "convex/_generated/**",
  ]),
  {
    // Auth-gated data (bookings, waitlist, availability) has its token in client
    // memory, so it is loaded in a mount effect after an await. The React Compiler
    // rule flags any setState reachable from an effect; here it is a legitimate,
    // guarded async data-load, so it is a warning rather than an error.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
