"use client";

import { CONTACT_EMAIL } from "@helvety/shared/config";
import { HELVETY_SWISS_ORIGIN_SEO } from "@helvety/shared/licensing";
import { Code2, Info, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { AccessibleSheetHeader } from "./accessible-sheet-header";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { NavbarBrand } from "./navbar-brand";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";
import { SHEET_SCROLLABLE_SHELL_CLASS } from "./sheet-scroll-layout";
import { ThemeSwitcher } from "./theme-switcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/** Props forwarded to `NavbarBrand`. */
export type HelvetyShellNavbarBrand = {
  currentApp: string;
  homeHref: string;
  homeAriaLabel: string;
  titleText?: string;
  titleHref?: string;
};

/** Props for `HelvetyShellNavbar`. */
export type HelvetyShellNavbarProps = {
  brand: HelvetyShellNavbarBrand;
  /** App-specific introduction for the first About-dialog section. */
  aboutDescription: string;
  navigationMenuDescription: string;
  versionLabel: string | null;
};

/**
 * Shared top navigation chrome for Helvety web apps in this monorepo.
 * Public shell only: brand, About, GitHub, and theme. No account or session UI.
 */
export function HelvetyShellNavbar({
  brand,
  aboutDescription,
  navigationMenuDescription,
  versionLabel,
}: HelvetyShellNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { resolvedTheme, setTheme, theme: currentTheme } = useTheme();

  const isDark = (resolvedTheme ?? "light") === "dark";
  const toggleTheme = () => {
    if (currentTheme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else {
      setTheme(currentTheme === "light" ? "dark" : "light");
    }
  };

  const versionInfo = versionLabel?.replace(/^(?:Built|Generated) on\s+/u, "");

  return (
    <nav className="bg-surface-chrome/80 supports-[backdrop-filter]:bg-surface-chrome/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <NavbarBrand {...brand} />
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label="Open about dialog"
                    onClick={() => setAboutOpen(true)}
                  />
                }
              >
                <Info className="size-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>About</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    render={
                      <a
                        href="https://github.com/CasparRubin/helvety"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View source code on GitHub"
                      />
                    }
                    nativeButton={false}
                  />
                }
              >
                <Code2 className="size-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>View source code on GitHub</p>
              </TooltipContent>
            </Tooltip>

            <ThemeSwitcher />
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className="inline-flex sm:hidden"
                />
              }
            >
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right" className={SHEET_SCROLLABLE_SHELL_CLASS}>
              <AccessibleSheetHeader
                className="shrink-0"
                title="Menu"
                description={navigationMenuDescription}
              />
              <ScrollArea className="min-h-0 flex-1">
                <nav className="flex flex-col gap-2 px-4 pb-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAboutOpen(true);
                    }}
                  >
                    <Info className="size-4" />
                    About
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    render={
                      <a
                        href="https://github.com/CasparRubin/helvety"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                      />
                    }
                    nativeButton={false}
                  >
                    <Code2 className="size-4" />
                    GitHub
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      toggleTheme();
                    }}
                  >
                    {isDark ? (
                      <Sun className="size-4" />
                    ) : (
                      <Moon className="size-4" />
                    )}
                    {isDark ? "Light mode" : "Dark mode"}
                  </Button>
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent>
          <DialogHeader className="pr-8">
            <DialogTitle>About</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <DialogDescription>{aboutDescription}</DialogDescription>
            <Separator />
            <section
              className="space-y-2"
              aria-labelledby="about-helvety-heading"
            >
              <h3 id="about-helvety-heading" className="text-sm font-medium">
                Helvety
              </h3>
              <div className="text-muted-foreground space-y-2 text-sm">
                <p>
                  Helvety software by{" "}
                  <a
                    href="https://casparrubin.ch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground underline underline-offset-2"
                  >
                    Caspar Rubin
                  </a>
                  .
                </p>
                <p>{HELVETY_SWISS_ORIGIN_SEO}</p>
                <p>
                  {versionInfo
                    ? `Version information generated on ${versionInfo}.`
                    : "Build information is unavailable."}
                </p>
              </div>
            </section>
            <Separator />
            <section
              className="space-y-2"
              aria-labelledby="about-contact-heading"
            >
              <h3 id="about-contact-heading" className="text-sm font-medium">
                Contact
              </h3>
              <p className="text-muted-foreground text-sm">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="hover:text-foreground underline underline-offset-2"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </section>
          </div>
          <DialogClose render={<Button variant="outline" className="w-full" />}>
            Close
          </DialogClose>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
