import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Multi-zone: serve this app under helvety.com/pdf
  basePath: "/pdf",

  compress: true,

  headers: createSecurityHeaders({ appName: "pdf" }),

  // Disables the canvas module to prevent SSR errors with PDF.js
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },

  turbopack: {
    root: path.resolve("../.."),
  },

  reactCompiler: true,

  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui", "sonner"],
  },
};

export default nextConfig;
