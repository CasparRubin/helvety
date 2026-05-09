"use client";

import { urls } from "@helvety/shared/config";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";
import { IMAGE_FILE_SIZE_LIMIT_COPY } from "@/lib/product-copy";

import type { User } from "@supabase/supabase-js";

const aboutDescription = `Helvety Image Upscaler upscales images in your browser-2×/4× or exact target dimensions, with on-device AI (Real-ESRGAN via WebGPU/WASM) or a canvas-based fallback. No image pixels leave your device. Fair-use safeguards apply (${IMAGE_FILE_SIZE_LIMIT_COPY}) so the tool stays stable. Switzerland-first service posture; not actively targeted to EU/EEA markets.`;

/** Main navigation bar for the Image Upscaler app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: "Image Upscaler",
        homeHref: urls.home,
        homeAriaLabel: "Visit Helvety.com",
        openHomeInNewTab: true,
        titleText: "Image Upscaler",
        titleHref: "/",
      }}
      aboutDescription={aboutDescription}
      navigationMenuDescription="Image Upscaler navigation menu"
      versionLabel={VERSION ?? null}
      account={{ variant: "external-store" }}
    />
  );
}
