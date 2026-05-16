import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "links",
  basePath: "/links",
  assetPrefix: "/links-static",
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
