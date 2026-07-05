import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle LOOP.md into the /loop server function so it can be read at runtime on
  // Vercel. sourceRef: src/app/loop/page.tsx.
  outputFileTracingIncludes: {
    "/loop": ["./LOOP.md"],
  },
};

export default nextConfig;
