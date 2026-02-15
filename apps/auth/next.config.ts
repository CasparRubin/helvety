import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";
import bundleAnalyzer from "@next/bundle-analyzer";

import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Multi-zone: serve this app under helvety.com/auth
  basePath: "/auth",

  compress: true,

  headers: createSecurityHeaders({ appName: "auth" }),

  turbopack: {
    root: path.resolve("../.."),
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "sonner",
      "@simplewebauthn/browser",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
