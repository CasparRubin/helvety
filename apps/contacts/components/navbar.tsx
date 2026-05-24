"use client";

import { CONTACTS_NAVBAR_ABOUT } from "@helvety/shared/app-navbar-about";
import { createE2eeAppNavbar } from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Contacts app shell navbar - see `E2eeAppNavbar` in `@helvety/ui`. */
export const Navbar = createE2eeAppNavbar({
  currentApp: "Contacts",
  titleText: "Contacts",
  aboutDescription: CONTACTS_NAVBAR_ABOUT,
  versionLabel: VERSION ?? null,
});
