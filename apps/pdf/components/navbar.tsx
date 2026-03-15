"use client";

import {
  redirectToLogin,
  redirectToLogout,
} from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import {
  Github,
  Info,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User as UserIcon,
} from "@helvety/ui/animated-icons";
import { Button } from "@helvety/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@helvety/ui/dialog";
import { NavbarBrand } from "@helvety/ui/navbar-brand";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@helvety/ui/popover";
import { Separator } from "@helvety/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@helvety/ui/sheet";
import { ThemeSwitcher } from "@helvety/ui/theme-switcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@helvety/ui/tooltip";
import { useNavbarAuthState } from "@helvety/ui/use-navbar-auth-state";
import { useTheme } from "next-themes";
import { useState } from "react";

import { VERSION } from "@/lib/config/version";
import { PDF_FILE_SIZE_LIMIT_COPY } from "@/lib/product-copy";

import type { User } from "@supabase/supabase-js";

/**
 * Main navigation bar component for the PDF app
 *
 * Features:
 * - App switcher for navigating between Helvety ecosystem apps
 * - Logo and branding with "PDF" label
 * - Desktop (sm+): auth entry, About dialog, GitHub link, theme switcher
 * - Burger menu (below sm): auth entry, About, GitHub, theme toggle
 *
 * Helvety PDF is free to use with operational file-size safeguards.
 * Login is optional for cross-app session sharing.
 */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
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

  const handleLogin = () => {
    redirectToLogin();
  };

  const handleLogout = () => {
    // Redirect to centralized auth service for logout
    redirectToLogout(window.location.href);
  };

  return (
    <nav className="bg-surface-chrome/80 supports-[backdrop-filter]:bg-surface-chrome/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <NavbarBrand
          currentApp="PDF"
          homeHref={urls.home}
          homeAriaLabel="Visit Helvety.com"
          openHomeInNewTab
          titleText="PDF"
          titleHref="/"
        />
        <div className="flex shrink-0 items-center gap-2">
          {/* Desktop: sign in/profile, About, GitHub, theme — hidden below sm */}
          <div className="hidden items-center gap-2 sm:flex">
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
                    Privacy-focused, client-side PDF toolkit for merging,
                    reordering, deleting, rotating, and extracting pages.
                    Processing is performed locally in your browser for
                    supported operations. Free to use with technical safeguards
                    ({PDF_FILE_SIZE_LIMIT_COPY}). Engineered & Designed in
                    Switzerland.
                  </DialogDescription>
                </DialogHeader>
                <div className="border-t" />
                <p className="text-muted-foreground text-xs">
                  {VERSION || "Development build"}
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

          {/* Burger menu — only below sm */}
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
                  PDF navigation menu
                </SheetDescription>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2 px-4">
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
