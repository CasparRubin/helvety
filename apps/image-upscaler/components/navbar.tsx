"use client";

import { urls } from "@helvety/shared/config";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";
import { IMAGE_FILE_SIZE_LIMIT_COPY } from "@/lib/product-copy";

import type { User } from "@supabase/supabase-js";

const aboutDescription = `Helvety Image Upscaler resizes images in your browser—2×/4× or exact target dimensions with high-quality resampling, no upload of image pixels to our servers. Fair-use safeguards apply (${IMAGE_FILE_SIZE_LIMIT_COPY}) so the tool stays stable.`;

/** Main navigation bar for the Image Upscaler app — see `HelvetyShellNavbar` in `@helvety/ui`. */
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
