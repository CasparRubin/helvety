"use client";

import {
  CONTACTS_NAVBAR_ABOUT,
  E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
} from "@helvety/shared/app-navbar-about";
import { E2eeAppNavbar } from "@helvety/ui/e2ee-app-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

const labels = {
  currentApp: "Contacts",
  titleText: "Contacts",
  encryptionTooltipBody: E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  aboutDescription: CONTACTS_NAVBAR_ABOUT,
  navigationMenuDescription: "Contacts navigation menu",
} as const;

/** Contacts app shell navbar - see `E2eeAppNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <E2eeAppNavbar
      initialUser={initialUser}
      labels={labels}
      versionLabel={VERSION ?? null}
    />
  );
}
