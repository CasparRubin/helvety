import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "pdf",
  // Multi-zone: serve this app under helvety.com/pdf.
  basePath: "/pdf",
  overrides: {
    // Disables the canvas module to prevent SSR errors with PDF.js (Turbopack default build).
    turbopack: {
      resolveAlias: {
        // PDF.js must not pull node-canvas during SSR (same intent as legacy webpack `canvas: false`).
        canvas: "./lib/empty-canvas-stub.mjs",
      },
    },
  },
});

export default nextConfig;
