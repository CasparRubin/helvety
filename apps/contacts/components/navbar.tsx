"use client";

import { E2eeAppNavbar } from "@helvety/ui/e2ee-app-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

const labels = {
  currentApp: "Contacts",
  titleText: "Contacts",
  encryptionTooltipBody:
    "Sensitive contact content fields are encrypted on your device before storage. Some structural metadata (such as timestamps, relationships, and display preferences) remains plaintext to support app functionality.",
  aboutDescription:
    "Privacy-focused contact management with client-side encryption for sensitive content fields. Engineered, Designed & Made in Switzerland.",
  navigationMenuDescription: "Contacts navigation menu",
} as const;

/** Contacts app shell navbar — see `E2eeAppNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <E2eeAppNavbar
      initialUser={initialUser}
      labels={labels}
      versionLabel={VERSION ?? null}
    />
  );
}
