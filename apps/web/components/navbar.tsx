"use client";

import { WEB_NAVBAR_ABOUT } from "@helvety/shared/app-navbar-about";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

/** Main navigation bar for the Web app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: "Home",
        homeHref: "/",
        homeAriaLabel: "Go to home",
      }}
      aboutDescription={WEB_NAVBAR_ABOUT}
      navigationMenuDescription="Home navigation menu"
      versionLabel={VERSION ?? null}
      account={{ variant: "external-store" }}
    />
  );
}
