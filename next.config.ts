import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root explicitly: a stray lockfile outside the repo
  // otherwise makes Next.js infer the wrong root directory.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
