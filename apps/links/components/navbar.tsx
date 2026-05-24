"use client";

import { LINKS_NAVBAR_ABOUT } from "@helvety/shared/app-navbar-about";
import { createE2eeAppNavbar } from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Links app shell navbar - see `E2eeAppNavbar` in `@helvety/ui`. */
export const Navbar = createE2eeAppNavbar({
  currentApp: "Links",
  titleText: "Links",
  aboutDescription: LINKS_NAVBAR_ABOUT,
  versionLabel: VERSION ?? null,
});
