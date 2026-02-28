import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multi-zone: serve this app under helvety.com/auth
  basePath: "/auth",

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
