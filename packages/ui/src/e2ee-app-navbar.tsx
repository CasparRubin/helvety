"use client";

import {
  redirectToLogin,
  redirectToLogout,
} from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import {
  CircleUser as UserIcon,
  Github,
  Info,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

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
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { Separator } from "./separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { ThemeSwitcher } from "./theme-switcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { useNavbarAuthState } from "./use-navbar-auth-state";

import type { User } from "@supabase/supabase-js";

/** App-specific navbar copy (Contacts / Notes / Tasks). */
export type E2eeAppNavbarLabels = {
  currentApp: string;
  titleText: string;
  /** First body paragraph in the encryption tooltip (after the heading). */
  encryptionTooltipBody: string;
  /** About dialog body. */
  aboutDescription: string;
  /** SheetDescription for the mobile menu. */
  navigationMenuDescription: string;
};

/** Props for `E2eeAppNavbar`. */
export type E2eeAppNavbarProps = {
  initialUser?: User | null;
  labels: E2eeAppNavbarLabels;
  /** Build label from the host app (e.g. `VERSION` from `@/lib/config/version`). */
  versionLabel: string | null;
};

/**
 * Shared navigation bar for Contacts, Notes, and Tasks (E2EE zones).
 */
export function E2eeAppNavbar({
  initialUser = null,
  labels,
  versionLabel,
}: E2eeAppNavbarProps) {
  const {
    isUnlocked,
    isLoading: encryptionLoading,
    unlockedForUserId,
  } = useEncryptionContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isLoading } = useNavbarAuthState(initialUser);
  const { resolvedTheme, setTheme, theme: currentTheme } = useTheme();

  const isDark = (resolvedTheme ?? "light") === "dark";
  const toggleTheme = () => {
    if (currentTheme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else {
      setTheme(currentTheme === "light" ? "dark" : "light");
    }
  };

  const handleLogin = () => {
    redirectToLogin();
  };

  const handleLogout = () => {
    redirectToLogout(window.location.href);
  };

  const isAuthenticated = !!user;
  const isEncryptedForCurrentUser =
    isUnlocked && !!user?.id && unlockedForUserId === user.id;

  return (
    <nav className="bg-surface-chrome/80 supports-[backdrop-filter]:bg-surface-chrome/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <NavbarBrand
          currentApp={labels.currentApp}
          homeHref={urls.home}
          homeAriaLabel="Visit Helvety.com"
          openHomeInNewTab
          titleText={labels.titleText}
          titleHref="/"
        />
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            {!encryptionLoading && isEncryptedForCurrentUser && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground flex cursor-default items-center gap-1.5 text-sm">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <span className="hidden md:inline">Encryption enabled</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs space-y-2 p-3">
                  <p className="font-semibold">Client-Side Encryption</p>
                  <p>{labels.encryptionTooltipBody}</p>
                  <p>
                    Encryption is tied to your passkey. If you lose your
                    available passkeys, encrypted content cannot be recovered.
                    Helvety cannot restore access. Use your platform&apos;s
                    built-in password app with cloud sync to reduce lockout
                    risk.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            {!isAuthenticated && !isLoading && (
              <Button variant="default" size="sm" onClick={handleLogin}>
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            )}

            {isAuthenticated && !isLoading && (
              <Popover open={profileOpen} onOpenChange={setProfileOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open profile menu"
                  >
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <PopoverHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                        <UserIcon className="text-primary h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <PopoverTitle className="truncate">
                          {user?.email ?? "Account"}
                        </PopoverTitle>
                        <PopoverDescription>Signed in</PopoverDescription>
                      </div>
                    </div>
                  </PopoverHeader>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href={`${urls.store}/account`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Settings className="h-4 w-4" />
                        Account
                      </a>
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Open about dialog"
                    onClick={() => setAboutOpen(true)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>About</p>
                </TooltipContent>
              </Tooltip>
              <DialogContent>
                <DialogHeader className="pr-8">
                  <DialogTitle>About</DialogTitle>
                  <DialogDescription className="pt-2">
                    {labels.aboutDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className="border-t" />
                <p className="text-muted-foreground text-xs">
                  {versionLabel ?? "Development build"}
                </p>
                <DialogClose asChild>
                  <Button variant="outline" className="w-full">
                    Close
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>

            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/CasparRubin/helvety"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View source code on GitHub"
                >
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Github className="h-4 w-4" />
                  </Button>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>View source code on GitHub</p>
              </TooltipContent>
            </Tooltip>

            <ThemeSwitcher />
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="inline-flex sm:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  {labels.navigationMenuDescription}
                </SheetDescription>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2 px-4">
                {!encryptionLoading && isEncryptedForCurrentUser && (
                  <div className="text-muted-foreground flex h-9 items-center gap-2 px-2.5 text-sm">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-green-500" />
                    <span>Encryption enabled</span>
                  </div>
                )}
                {!isAuthenticated && !isLoading && (
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogin();
                    }}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Button>
                )}
                {isAuthenticated && !isLoading && (
                  <>
                    <div className="text-muted-foreground flex h-9 items-center gap-2 px-2.5 text-sm">
                      <UserIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {user?.email ?? "Account"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href={`${urls.store}/account`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Account
                      </a>
                    </Button>
                    <Separator />
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </>
                )}
                <Separator />
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAboutOpen(true);
                  }}
                >
                  <Info className="h-4 w-4" />
                  About
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <a
                    href="https://github.com/CasparRubin/helvety"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    toggleTheme();
                  }}
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {isDark ? "Light mode" : "Dark mode"}
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
