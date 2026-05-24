"use client";

import { imageUpscalerNavbarAbout } from "@helvety/shared/app-navbar-about";
import {
  createPublicShellNavbar,
  publicToolNavbarBrand,
} from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Main navigation bar for the Image Upscaler app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export const Navbar = createPublicShellNavbar({
  brand: publicToolNavbarBrand("Image Upscaler"),
  aboutDescription: imageUpscalerNavbarAbout(),
  navigationMenuDescription: "Image Upscaler navigation menu",
  versionLabel: VERSION ?? null,
  account: { variant: "external-store" },
});
