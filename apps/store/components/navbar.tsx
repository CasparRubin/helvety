"use client";

import { STORE_NAVBAR_ABOUT } from "@helvety/shared/app-navbar-about";
import { urls } from "@helvety/shared/config";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

/** Main navigation bar for the Store app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: "Store",
        homeHref: urls.home,
        homeAriaLabel: "Visit Helvety.com",
        titleText: "STORE",
        titleHref: "/",
      }}
      aboutDescription={STORE_NAVBAR_ABOUT}
      navigationMenuDescription="Store navigation menu"
      versionLabel={VERSION ?? null}
      account={{ variant: "same-origin", href: "/account" }}
    />
  );
}
