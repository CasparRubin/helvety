import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multi-zone: serve this app under helvety.com/auth
  basePath: "/auth",
  // Multi-zone: isolate this zone's Next.js assets when proxied via web gateway.
  assetPrefix: "/auth-static",

  compress: true,

  headers: createSecurityHeaders({ appName: "auth" }),

  turbopack: {
    root: path.resolve("../.."),
  },

  reactCompiler: true,

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "sonner",
      "@simplewebauthn/browser",
    ],
  },
};

export default nextConfig;
