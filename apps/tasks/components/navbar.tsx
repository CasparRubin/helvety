"use client";

import { TASKS_NAVBAR_ABOUT } from "@helvety/shared/app-navbar-about";
import { createE2eeAppNavbar } from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Tasks app shell navbar - see `E2eeAppNavbar` in `@helvety/ui`. */
export const Navbar = createE2eeAppNavbar({
  currentApp: "Tasks",
  titleText: "Tasks",
  aboutDescription: TASKS_NAVBAR_ABOUT,
  versionLabel: VERSION ?? null,
});
