import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "contacts",
  // Multi-zone: serve this app under helvety.com/contacts.
  basePath: "/contacts",
  // Multi-zones: avoid asset conflicts with other zones.
  assetPrefix: "/contacts-static",
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
