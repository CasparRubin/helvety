"use client";

import { E2eeAppNavbar } from "@helvety/ui/e2ee-app-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

const labels = {
  currentApp: "Notes",
  titleText: "Notes",
  encryptionTooltipBody:
    "Sensitive note content fields are encrypted on your device before storage. Some structural metadata (such as timestamps, relationships, and display preferences) remains plaintext to support app functionality.",
  aboutDescription:
    "Helvety Notes is a simple space for capturing thoughts and keeping them organized. Personal, Work, and Other views help you stay focused without over-structuring. Sensitive note content is encrypted on your device before storage. Designed and built in Switzerland.",
  navigationMenuDescription: "Notes navigation menu",
} as const;

/** Notes app shell navbar — see `E2eeAppNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <E2eeAppNavbar
      initialUser={initialUser}
      labels={labels}
      versionLabel={VERSION ?? null}
    />
  );
}
