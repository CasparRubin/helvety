"use client";

import { urls } from "@helvety/shared/config";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

const aboutDescription =
  "Helvety Store is where Helvety products are published and maintained. You can explore tools, access downloads, and manage your account from one place. It is made to stay straightforward and easy to trust.";

/** Main navigation bar for the Store app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: "Store",
        homeHref: urls.home,
        homeAriaLabel: "Visit Helvety.com",
        openHomeInNewTab: true,
        titleText: "STORE",
        titleHref: "/",
      }}
      aboutDescription={aboutDescription}
      navigationMenuDescription="Store navigation menu"
      versionLabel={VERSION ?? null}
      account={{ variant: "same-origin", href: "/account" }}
    />
  );
}
