import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Without this, Turbopack walks up looking for a lockfile and picks up
    // C:\3Vibe1\package-lock.json (an unrelated parent project), which
    // breaks node_modules resolution (e.g. "Cannot find module
    // 'nanoid/non-secure'") and crashes client-side hydration.
    root: path.join(__dirname),
  },
};

export default nextConfig;
