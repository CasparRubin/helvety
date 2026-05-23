import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "docs",
  basePath: "/docs",
  optimizePackageImports: ["lucide-react", "@eigenpal/docx-editor-react"],
});

export default nextConfig;
