import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";
import bundleAnalyzer from "@next/bundle-analyzer";

import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Multi-zone: serve this app under helvety.com/pdf
  basePath: "/pdf",

  compress: true,

  headers: createSecurityHeaders({ appName: "pdf" }),

  // Webpack fallback: disables the canvas module to prevent SSR errors with PDF.js
  // (production uses Turbopack; kept for compatibility if webpack is ever used)
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

  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui", "sonner"],
  },
};

export default withBundleAnalyzer(nextConfig);
