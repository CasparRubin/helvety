"use client";

import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

const aboutDescription =
  "This is the home base for Helvety. It helps you move between apps, discover tools, and access your account in one place. Helvety builds practical software that respects clarity and privacy.";

/** Main navigation bar for the Web app — see `HelvetyShellNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: "Home",
        homeHref: "/",
        homeAriaLabel: "Go to home",
      }}
      aboutDescription={aboutDescription}
      navigationMenuDescription="Home navigation menu"
      versionLabel={VERSION ?? null}
      account={{ variant: "external-store" }}
    />
  );
}
