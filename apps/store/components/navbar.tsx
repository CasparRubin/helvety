"use client";

import { HelvetyIdentifier, HelvetyLogo } from "@helvety/brand";
import {
  redirectToLogin,
  redirectToLogout,
} from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { AppSwitcher } from "@helvety/ui/app-switcher";
import { Button } from "@helvety/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@helvety/ui/dialog";
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
import {
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  User as UserIcon,
  Github,
  Info,
  Settings,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

/**
 * Main navigation bar component for the Store app
 *
 * Features:
 * - App switcher for navigating between Helvety ecosystem apps
 * - Logo and branding with "STORE" label
 * - Desktop (sm+): About dialog, GitHub link, theme switcher, profile menu
 * - Burger menu (below sm): About, GitHub, theme toggle, account, sign in/out
 */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  const supabase = createBrowserClient();
  const [user, setUser] = useState<User | null>(initialUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const { resolvedTheme, setTheme, theme: currentTheme } = useTheme();

  const isDark = (resolvedTheme ?? "light") === "dark";
  const toggleTheme = () => {
    if (currentTheme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else {
      setTheme(currentTheme === "light" ? "dark" : "light");
    }
  };

  useEffect(() => {
    // If we already have an initial user from the server, skip the client-side fetch
    if (initialUser) {
      // Still subscribe to auth state changes for real-time updates
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => subscription.unsubscribe();
    }

    const getUser = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u ?? null);
      setIsLoading(false);
    };
    void getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth, initialUser]);

  const isAuthenticated = !!user;

  const handleLogin = () => {
    redirectToLogin();
  };

  const handleLogout = () => {
    // Redirect to centralized auth service for logout
    redirectToLogout(window.location.origin);
  };

  return (
    <nav className="bg-surface-chrome/80 supports-[backdrop-filter]:bg-surface-chrome/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AppSwitcher currentApp="Store" />
          <a
            href={urls.home}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-80"
            aria-label="Visit Helvety.com"
          >
            <HelvetyLogo
              aria-label="Helvety"
              className="hidden h-8 w-auto sm:block"
            />
            <HelvetyIdentifier
              aria-label="Helvety"
              className="h-8 w-auto sm:hidden"
            />
          </a>
          <Link
            href="/"
            className="shrink-0 text-xl font-black tracking-tight transition-opacity hover:opacity-80"
            aria-label="Go to STORE home"
          >
            STORE
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Desktop: About, GitHub, theme, sign in, profile — hidden below sm */}
          <div className="hidden items-center gap-2 sm:flex">
            <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
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
                    Official Helvety Store. Software and subscriptions
                    engineered & designed in Switzerland.
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

            {!isAuthenticated && !isLoading && (
              <Button variant="default" size="sm" onClick={handleLogin}>
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            )}

            {isAuthenticated && !isLoading && (
              <Popover open={profileOpen} onOpenChange={setProfileOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
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
                      <Link
                        href="/account"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Account
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link
                        href="/subscriptions"
                        onClick={() => setProfileOpen(false)}
                      >
                        <CreditCard className="h-4 w-4" />
                        Subscriptions
                      </Link>
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
          </div>

          {/* Burger menu — only below sm */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="inline-flex sm:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Store navigation menu
                </SheetDescription>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2 px-4">
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
                <Separator />
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
                      <Link
                        href="/account"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Account
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link
                        href="/subscriptions"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <CreditCard className="h-4 w-4" />
                        Subscriptions
                      </Link>
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
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
