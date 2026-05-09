"use client";

import { urls } from "@helvety/shared/config";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";
import { PDF_FILE_SIZE_LIMIT_COPY } from "@/lib/product-copy";

import type { User } from "@supabase/supabase-js";

const aboutDescription = `Helvety PDF helps you merge, reorder, rotate, and extract pages directly in your browser. The workflow is quick and visual, with tools built for everyday document cleanup. It is free to use with technical safeguards (${PDF_FILE_SIZE_LIMIT_COPY}).`;

/** Main navigation bar for the PDF app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: "PDF",
        homeHref: urls.home,
        homeAriaLabel: "Visit Helvety.com",
        openHomeInNewTab: true,
        titleText: "PDF",
        titleHref: "/",
      }}
      aboutDescription={aboutDescription}
      navigationMenuDescription="PDF navigation menu"
      versionLabel={VERSION ?? null}
      account={{ variant: "external-store" }}
    />
  );
}
