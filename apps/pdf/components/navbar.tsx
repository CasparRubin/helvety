"use client";

import {
  CreditCard,
  Github,
  Menu,
  Moon,
  Sun,
  Info,
  LogIn,
  LogOut,
  User as UserIcon,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { AppSwitcher } from "@/components/app-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { redirectToLogin, redirectToLogout } from "@/lib/auth-redirect";
import { VERSION } from "@/lib/config/version";
import { createBrowserClient } from "@/lib/supabase/client";

import type { User } from "@supabase/supabase-js";

/**
 * Main navigation bar component for helvety-pdf
 *
 * Features:
 * - App switcher for navigating between Helvety ecosystem apps
 * - Logo and branding with "PDF" label
 * - Desktop (sm+): About dialog, GitHub link, theme switcher, profile menu
 * - Burger menu (below sm): About, GitHub, theme toggle, account, sign in/out
 *
 * Helvety PDF is a free tool (up to 100MB per file). Login is optional for cross-app session sharing.
 */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const supabase = createBrowserClient();
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
    if (initialUser) {
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
    <nav className="bg-card/50 supports-[backdrop-filter]:bg-card/30 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AppSwitcher currentApp="PDF" />
          <a
            href="https://helvety.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-80"
            aria-label="Visit Helvety.com"
          >
            <Image
              src="/helvety_logo_white.svg"
              alt="Helvety"
              width={120}
              height={30}
              className="hidden h-8 w-auto sm:block"
              loading="eager"
            />
            <Image
              src="/helvety_identifier_whiteBg.svg"
              alt="Helvety"
              width={30}
              height={30}
              className="h-8 w-auto sm:hidden"
              loading="eager"
            />
          </a>
          <Link
            href="/"
            className="text-xl font-black tracking-tight transition-opacity hover:opacity-80"
          >
            PDF
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
                    Privacy-focused, client-side PDF toolkit for merging,
                    reordering, rotating, and extracting pages. All processing
                    happens locally in your browser. Free to use, up to 100MB
                    per file. Engineered & Designed in Switzerland.
                  </DialogDescription>
                </DialogHeader>
                <div className="border-t" />
                <p className="text-muted-foreground text-xs">
                  {VERSION || "Unknown build time"}
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
                  href="https://github.com/CasparRubin/helvety-pdf"
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
                      <a
                        href="https://store.helvety.com/account"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Settings className="h-4 w-4" />
                        Account
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href="https://store.helvety.com/subscriptions"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <CreditCard className="h-4 w-4" />
                        Subscriptions
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
                    href="https://github.com/CasparRubin/helvety-pdf"
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
                      <a
                        href="https://store.helvety.com/account"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Account
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href="https://store.helvety.com/subscriptions"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <CreditCard className="h-4 w-4" />
                        Subscriptions
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
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
