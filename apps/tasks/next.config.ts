import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";
import bundleAnalyzer from "@next/bundle-analyzer";

import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Multi-zone: serve this app under helvety.com/tasks
  basePath: "/tasks",

  compress: true,

  headers: createSecurityHeaders({ appName: "tasks" }),

  turbopack: {
    root: path.resolve("../.."),
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "sonner",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@tiptap/react",
      "@simplewebauthn/browser",
      "date-fns",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
