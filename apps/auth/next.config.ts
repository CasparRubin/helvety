import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "auth",
  // Multi-zone: serve this app under helvety.com/auth.
  basePath: "/auth",
  // Multi-zone: isolate this zone's Next.js assets when proxied via web gateway.
  assetPrefix: "/auth-static",
  optimizePackageImports: [
    "lucide-react",
    "radix-ui",
    "sonner",
    "@simplewebauthn/browser",
  ],
});

export default nextConfig;
