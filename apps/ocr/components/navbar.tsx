"use client";

import { ocrNavbarAbout } from "@helvety/shared/app-navbar-about";
import {
  createPublicShellNavbar,
  publicToolNavbarBrand,
} from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Main navigation bar for the OCR app. */
export const Navbar = createPublicShellNavbar({
  brand: publicToolNavbarBrand("OCR"),
  aboutDescription: ocrNavbarAbout(),
  navigationMenuDescription: "OCR navigation menu",
  versionLabel: VERSION ?? null,
  account: { variant: "external-store" },
});
