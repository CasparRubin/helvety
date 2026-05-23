import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "notes",
  // Multi-zone: serve this app under helvety.com/notes.
  basePath: "/notes",
  // Multi-zones: avoid asset conflicts with other zones.
  assetPrefix: "/notes-static",
  optimizePackageImports: [
    "lucide-react",
    "radix-ui",
    "sonner",
    "@dnd-kit/core",
    "@dnd-kit/sortable",
    "@dnd-kit/utilities",
  ],
});

export default nextConfig;
