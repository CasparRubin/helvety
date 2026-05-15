"use client";

import { urls } from "@helvety/shared/config";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";
import { IMAGE_FILE_SIZE_LIMIT_COPY } from "@/lib/product-copy";

import type { User } from "@supabase/supabase-js";

const aboutDescription = `Helvety Image Upscaler enlarges PNG, JPEG, and WebP in your browser. Choose 2× or 4×, or set a target width or height. AI runs on your device when supported; otherwise the app uses high-quality resizing. Images are not sent to Helvety for processing (${IMAGE_FILE_SIZE_LIMIT_COPY} per file). Switzerland-first service; not actively marketed to EU/EEA users.`;

/** Main navigation bar for the Image Upscaler app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: "Image Upscaler",
        homeHref: urls.home,
        homeAriaLabel: "Visit Helvety.com",
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
