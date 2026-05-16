"use client";

import {
  E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  LINKS_NAVBAR_ABOUT,
} from "@helvety/shared/app-navbar-about";
import { E2eeAppNavbar } from "@helvety/ui/e2ee-app-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

const labels = {
  currentApp: "Links",
  titleText: "Links",
  encryptionTooltipBody: E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  aboutDescription: LINKS_NAVBAR_ABOUT,
  navigationMenuDescription: "Links navigation menu",
} as const;

/**
 *
 */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <E2eeAppNavbar
      initialUser={initialUser}
      labels={labels}
      versionLabel={VERSION ?? null}
    />
  );
}
