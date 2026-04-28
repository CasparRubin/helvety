import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "pdf",
  // Multi-zone: serve this app under helvety.com/pdf.
  basePath: "/pdf",
  overrides: {
    // Disables the canvas module to prevent SSR errors with PDF.js.
    webpack: (config) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
      return config;
    },
  },
});

export default nextConfig;
