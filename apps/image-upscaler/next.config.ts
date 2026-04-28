import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "image-upscaler",
  // Multi-zone: serve this app under helvety.com/image-upscaler.
  basePath: "/image-upscaler",
});

export default nextConfig;
