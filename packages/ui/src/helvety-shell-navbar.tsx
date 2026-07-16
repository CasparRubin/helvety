"use client";

import {
  redirectToLogin,
  redirectToLogout,
} from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import {
  CircleUser as UserIcon,
  Code2,
  Info,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, type ReactNode } from "react";

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
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";
import { SHEET_SCROLLABLE_SHELL_CLASS } from "./sheet-scroll-layout";
import { ThemeSwitcher } from "./theme-switcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { useNavbarAuthState } from "./use-navbar-auth-state";

import type { User } from "@helvety/shared/supabase-types";

/** Props forwarded to `NavbarBrand`. */
export type HelvetyShellNavbarBrand = {
  currentApp: string;
  homeHref: string;
  homeAriaLabel: string;
  titleText?: string;
  titleHref?: string;
};

/** Account entry: Helvety Store in another tab, or same-origin (e.g. Store app). */
export type HelvetyShellNavbarAccount =
  { variant: "external-store" } | { variant: "same-origin"; href: string };

/** Optional encryption badge (caller supplies tooltip body; no crypto hooks here). */
export type HelvetyShellNavbarEncryption = {
  loading: boolean;
  showBadge: boolean;
  tooltipContent: ReactNode;
};

/** Auth snapshot passed to `encryption` when it is a function (e.g. E2EE product apps). */
export type HelvetyShellNavbarAuthSnapshot = {
  user: User | null;
  isLoading: boolean;
};

/** Props for `HelvetyShellNavbar`. */
export type HelvetyShellNavbarProps = {
  initialUser?: User | null;
  brand: HelvetyShellNavbarBrand;
  aboutDescription: string;
  navigationMenuDescription: string;
  versionLabel: string | null;
  account: HelvetyShellNavbarAccount;
  /** When set, `redirectToLogin` receives the current page URL (e.g. Auth app). */
  loginReturnUrl?: "current";
  /**
   * Static config (Auth) or a function of navbar auth state (E2EE) so encryption
   * can depend on `user.id` without a second `useNavbarAuthState` subscription.
   */
  encryption?:
    | HelvetyShellNavbarEncryption
    | null
    | ((
        auth: HelvetyShellNavbarAuthSnapshot
      ) => HelvetyShellNavbarEncryption | null);
};

/** Account link for desktop popover (`outline`) or mobile sheet (`ghost`). */
function AccountLink({
  account,
  onNavigate,
  className,
  variant,
}: {
  account: HelvetyShellNavbarAccount;
  onNavigate: () => void;
  className: string;
  variant: "outline" | "ghost";
}) {
  if (account.variant === "same-origin") {
    return (
      <Button
        variant={variant}
        className={className}
        render={<Link href={account.href} onClick={onNavigate} />}
        nativeButton={false}
      >
        <Settings className="size-4" />
        Account
      </Button>
    );
  }
  return (
    <Button
      variant={variant}
      className={className}
      render={
        <a
          href={`${urls.store}/account`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
        />
      }
      nativeButton={false}
    >
      <Settings className="size-4" />
      Account
    </Button>
  );
}

/**
 * Shared top navigation chrome for Helvety web apps in this monorepo.
 * Does not call `useEncryptionContext`; callers may pass `encryption` as a
 * function of navbar auth state (Auth and `E2eeAppNavbar`), as a static object
 * (tests or rare one-offs), pass vault-only badge/tooltips, or omit it
 * (`web`, `store`, `pdf`, `image-upscaler`, `image-editor`, `ocr`).
 */
export function HelvetyShellNavbar({
  initialUser = null,
  brand,
  aboutDescription,
  navigationMenuDescription,
  versionLabel,
  account,
  loginReturnUrl,
  encryption = null,
}: HelvetyShellNavbarProps) {
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

  const isAuthenticated = !!user;
  const buildInfo = versionLabel?.replace(/^Built on\s+/u, "");

  const handleLogin = () => {
    if (loginReturnUrl === "current" && typeof window !== "undefined") {
      redirectToLogin(window.location.href);
    } else {
      redirectToLogin();
    }
  };

  const handleLogout = () => {
    redirectToLogout(window.location.href);
  };

  const resolvedEncryption =
    encryption == null
      ? null
      : typeof encryption === "function"
        ? encryption({ user, isLoading })
        : encryption;

  const encryptionBadge =
    resolvedEncryption &&
    !resolvedEncryption.loading &&
    resolvedEncryption.showBadge
      ? resolvedEncryption
      : null;

  return (
    <nav className="bg-surface-chrome/80 supports-[backdrop-filter]:bg-surface-chrome/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <NavbarBrand {...brand} />
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            {encryptionBadge && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="text-muted-foreground flex cursor-default items-center gap-1.5 text-sm" />
                  }
                >
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden md:inline">Encryption enabled</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs space-y-2 p-3">
                  {encryptionBadge.tooltipContent}
                </TooltipContent>
              </Tooltip>
            )}

            {!isAuthenticated && !isLoading && (
              <Button variant="default" size="sm" onClick={handleLogin}>
                <LogIn className="size-4" />
                Sign in
              </Button>
            )}

            {isAuthenticated && !isLoading && (
              <Popover open={profileOpen} onOpenChange={setProfileOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Open profile menu"
                    />
                  }
                >
                  <UserIcon className="size-5" />
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <PopoverHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                        <UserIcon className="text-primary size-5" />
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
                    <AccountLink
                      account={account}
                      onNavigate={() => setProfileOpen(false)}
                      className="w-full justify-start"
                      variant="outline"
                    />
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
                      <LogOut className="size-4" />
                      Sign out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

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
                  {encryptionBadge && (
                    <div className="text-muted-foreground flex h-9 items-center gap-2 px-2.5 text-sm">
                      <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
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
                      <LogIn className="size-4" />
                      Sign in
                    </Button>
                  )}
                  {isAuthenticated && !isLoading && (
                    <>
                      <div className="text-muted-foreground flex h-9 items-center gap-2 px-2.5 text-sm">
                        <UserIcon className="size-4 shrink-0" />
                        <span className="truncate">
                          {user?.email ?? "Account"}
                        </span>
                      </div>
                      <AccountLink
                        account={account}
                        onNavigate={() => setMobileMenuOpen(false)}
                        className="w-full justify-start"
                        variant="ghost"
                      />
                      <Separator />
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                      >
                        <LogOut className="size-4" />
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
            <DialogDescription className="pt-2">
              {aboutDescription} Helvety software by{" "}
              <a
                href="https://casparrubin.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Caspar Rubin
              </a>
              , engineered, designed, and made in Switzerland.{" "}
              {buildInfo
                ? `This version was built on ${buildInfo}.`
                : "This is a development build."}
            </DialogDescription>
          </DialogHeader>
          <DialogClose render={<Button variant="outline" className="w-full" />}>
            Close
          </DialogClose>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
