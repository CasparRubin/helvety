import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Multi-zone: serve this app under helvety.com/tasks
  basePath: "/tasks",

  // Multi-zones: avoid asset conflicts with other zones
  assetPrefix: "/tasks-static",

  compress: true,

  headers: createSecurityHeaders({ appName: "tasks" }),

  turbopack: {
    root: path.resolve("../.."),
  },

  reactCompiler: true,

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "sonner",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@tiptap/react",
      "date-fns",
    ],
  },
};

export default nextConfig;
