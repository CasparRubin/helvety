"use client";

import { E2eeAppNavbar } from "@helvety/ui/e2ee-app-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

const labels = {
  currentApp: "Tasks",
  titleText: "Tasks",
  encryptionTooltipBody:
    "Sensitive task content fields are encrypted on your device before storage. Some structural metadata (such as timestamps, relationships, and display preferences) remains plaintext to support app functionality.",
  aboutDescription:
    "Privacy-focused task management with client-side encryption for sensitive content fields. Engineered, Designed & Made in Switzerland.",
  navigationMenuDescription: "Tasks navigation menu",
} as const;

/** Tasks app shell navbar — see `E2eeAppNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <E2eeAppNavbar
      initialUser={initialUser}
      labels={labels}
      versionLabel={VERSION ?? null}
    />
  );
}
