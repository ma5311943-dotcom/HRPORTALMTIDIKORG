import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: path.resolve(),
  },
};

export default nextConfig;
