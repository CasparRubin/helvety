import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "store",
  // Multi-zone: serve this app under helvety.com/store.
  basePath: "/store",
  overrides: {
    images: {
      formats: ["image/avif", "image/webp"],
      qualities: [75],
      // Keep optimized images warm in cache while avoiding very long stale periods.
      minimumCacheTTL: 60 * 60 * 4,
      // Product screenshots use GitHub raw URLs / local artwork.
      remotePatterns: [
        {
          protocol: "https",
          hostname: "raw.githubusercontent.com",
        },
      ],
    },
  },
});

export default nextConfig;
