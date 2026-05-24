"use client";

import { pdfNavbarAbout } from "@helvety/shared/app-navbar-about";
import {
  createPublicShellNavbar,
  publicToolNavbarBrand,
} from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Main navigation bar for the PDF app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export const Navbar = createPublicShellNavbar({
  brand: publicToolNavbarBrand("PDF"),
  aboutDescription: pdfNavbarAbout(),
  navigationMenuDescription: "PDF navigation menu",
  versionLabel: VERSION ?? null,
  account: { variant: "external-store" },
});
