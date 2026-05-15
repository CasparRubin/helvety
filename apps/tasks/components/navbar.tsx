"use client";

import {
  E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  TASKS_NAVBAR_ABOUT,
} from "@helvety/shared/app-navbar-about";
import { E2eeAppNavbar } from "@helvety/ui/e2ee-app-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

const labels = {
  currentApp: "Tasks",
  titleText: "Tasks",
  encryptionTooltipBody: E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  aboutDescription: TASKS_NAVBAR_ABOUT,
  navigationMenuDescription: "Tasks navigation menu",
} as const;

/** Tasks app shell navbar - see `E2eeAppNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <E2eeAppNavbar
      initialUser={initialUser}
      labels={labels}
      versionLabel={VERSION ?? null}
    />
  );
}
