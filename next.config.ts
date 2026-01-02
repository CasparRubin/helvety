import type { NextConfig } from "next";
import path from "path";

// Generate version string at build time: v.0.yyMMdd.HHmm
function getBuildVersion(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `v.0.${yy}${MM}${dd}.${HH}${mm} - Experimental`;
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_VERSION: getBuildVersion(),
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
  // Set turbopack root to current working directory (should be project root when running npm run dev)
  turbopack: {
    root: path.resolve("."),
  },
};

export default nextConfig;
