"use client";

import { imageUpscalerNavbarAbout } from "@helvety/shared/app-navbar-about";
import { urls } from "@helvety/shared/config";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

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
      aboutDescription={imageUpscalerNavbarAbout()}
      navigationMenuDescription="Image Upscaler navigation menu"
      versionLabel={VERSION ?? null}
      account={{ variant: "external-store" }}
    />
  );
}
