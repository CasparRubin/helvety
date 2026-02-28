import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multi-zone: serve this app under helvety.com/contacts
  basePath: "/contacts",

  compress: true,

  headers: createSecurityHeaders({
    appName: "contacts",
  }),

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
