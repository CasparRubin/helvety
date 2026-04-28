import { createHelvetyNextConfig } from "@helvety/config/next";

import type { NextConfig } from "next";

const ALLOWED_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Builds strict Next image remotePatterns from NEXT_PUBLIC_SUPABASE_URL.
 * Returns an empty list when the URL is unset so local `next build` / monorepo
 * `ci:release` can run without `.env`; Vercel builds set VERCEL=1 and must
 * provide the variable so misconfiguration fails fast.
 */
function getStoreImageRemotePatterns(): Array<{
  protocol: "http" | "https";
  hostname: string;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    if (process.env.VERCEL === "1") {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL is required on Vercel to configure Next image remotePatterns for Store."
      );
    }
    return [];
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL (e.g. https://project.supabase.co)."
    );
  }

  if (!ALLOWED_IMAGE_PROTOCOLS.has(parsedUrl.protocol)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use http:// or https:// for image remotePatterns."
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use https:// in production."
    );
  }
  if (parsedUrl.hostname.includes("*")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL hostname must not contain wildcard characters."
    );
  }

  return [
    {
      protocol: parsedUrl.protocol === "https:" ? "https" : "http",
      hostname: parsedUrl.hostname,
    },
  ];
}

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "store",
  // Multi-zone: serve this app under helvety.com/store.
  basePath: "/store",
  overrides: {
    images: {
      formats: ["image/avif", "image/webp"],
      qualities: [75],
      remotePatterns: getStoreImageRemotePatterns(),
    },
  },
});

export default nextConfig;
