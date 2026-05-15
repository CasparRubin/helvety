"use client";

import { pdfNavbarAbout } from "@helvety/shared/app-navbar-about";
import { urls } from "@helvety/shared/config";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

/** Main navigation bar for the PDF app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: "PDF",
        homeHref: urls.home,
        homeAriaLabel: "Visit Helvety.com",
        titleText: "PDF",
        titleHref: "/",
      }}
      aboutDescription={pdfNavbarAbout()}
      navigationMenuDescription="PDF navigation menu"
      versionLabel={VERSION ?? null}
      account={{ variant: "external-store" }}
    />
  );
}
