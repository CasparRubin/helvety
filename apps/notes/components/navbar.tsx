"use client";

import {
  E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  NOTES_NAVBAR_ABOUT,
} from "@helvety/shared/app-navbar-about";
import { E2eeAppNavbar } from "@helvety/ui/e2ee-app-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

const labels = {
  currentApp: "Notes",
  titleText: "Notes",
  encryptionTooltipBody: E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  aboutDescription: NOTES_NAVBAR_ABOUT,
  navigationMenuDescription: "Notes navigation menu",
} as const;

/** Notes app shell navbar - see `E2eeAppNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <E2eeAppNavbar
      initialUser={initialUser}
      labels={labels}
      versionLabel={VERSION ?? null}
    />
  );
}
