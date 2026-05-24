import { createPublicToolNextConfig } from "@helvety/config/next";

const nextConfig = createPublicToolNextConfig({
  appName: "pdf",
  overrides: {
    turbopack: {
      resolveAlias: {
        canvas: "./lib/empty-canvas-stub.mjs",
      },
    },
  },
});

export default nextConfig;
