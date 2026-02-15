import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";
import bundleAnalyzer from "@next/bundle-analyzer";

import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Multi-zone: serve this app under helvety.com/store
  basePath: "/store",

  compress: true,

  headers: createSecurityHeaders({ appName: "store" }),

  turbopack: {
    root: path.resolve("../.."),
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui", "sonner"],
  },
};

export default withBundleAnalyzer(nextConfig);
