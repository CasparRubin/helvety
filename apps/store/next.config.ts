import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";

import type { NextConfig } from "next";

const ALLOWED_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

/** Build a strict remote image pattern from NEXT_PUBLIC_SUPABASE_URL. */
function getStoreImageRemotePattern(): {
  protocol: "http" | "https";
  hostname: string;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is required to configure Next image remotePatterns for Store."
    );
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

  return {
    protocol: parsedUrl.protocol === "https:" ? "https" : "http",
    hostname: parsedUrl.hostname,
  };
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Multi-zone: serve this app under helvety.com/store
  basePath: "/store",

  compress: true,

  headers: createSecurityHeaders({ appName: "store" }),

  turbopack: {
    root: path.resolve("../.."),
  },

  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    remotePatterns: [getStoreImageRemotePattern()],
  },

  reactCompiler: true,

  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui", "sonner"],
  },
};

export default nextConfig;
