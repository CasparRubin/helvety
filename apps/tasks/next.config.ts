import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "tasks",
  // Multi-zone: serve this app under helvety.com/tasks.
  basePath: "/tasks",
  // Multi-zones: avoid asset conflicts with other zones.
  assetPrefix: "/tasks-static",
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
});

export default nextConfig;
