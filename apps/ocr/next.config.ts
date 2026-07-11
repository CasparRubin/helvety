import { createPublicToolNextConfig } from "@helvety/config/next";

const nextConfig = createPublicToolNextConfig({
  appName: "ocr",
  overrides: {
    turbopack: {
      resolveAlias: {
        canvas: "./lib/empty-canvas-stub.mjs",
      },
    },
  },
});

export default nextConfig;
