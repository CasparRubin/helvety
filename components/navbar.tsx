"use client";

import {
  Building2,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  User as UserIcon,
  Github,
  Info,
  Settings,
  Package,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { redirectToLogin, redirectToLogout } from "@/lib/auth-redirect";
import { VERSION } from "@/lib/config/version";
import { useEncryptionContext } from "@/lib/crypto/encryption-context";
import { createClient } from "@/lib/supabase/client";

import type { User } from "@supabase/supabase-js";

/**
 * Main navigation bar component for helvety-store
 *
 * Features:
 * - App switcher for navigating between Helvety ecosystem apps
 * - Logo and branding with "STORE" label
 * - E2EE indicator, About dialog, GitHub link (in bar above 400px; in burger below 400px)
 * - Theme switcher (dark/light mode)
 * - Login button (shown when user is not authenticated)
 * - Profile menu with user email, links to Products, Account, Subscriptions, Tenants, and Sign out (shown when authenticated)
 * - Burger menu below 400px: E2EE, About, GitHub to save icon space
 */
export function Navbar() {
  const { isUnlocked, isLoading } = useEncryptionContext();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u ?? null);
    };
    void getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const isAuthenticated = !!user;

  const handleLogin = () => {
    redirectToLogin();
  };

  const handleLogout = () => {
    // Redirect to centralized auth service for logout
    redirectToLogout(window.location.origin);
  };

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AppSwitcher currentApp="Store" />
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
              priority
            />
            <Image
              src="/helvety_Identifier_whiteBg.svg"
              alt="Helvety"
              width={30}
              height={30}
              className="h-8 w-auto sm:hidden"
              priority
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
          {/* E2EE, About, GitHub - hidden below 400px (moved into burger) */}
          <div className="hidden items-center gap-2 min-[401px]:flex">
            {!isLoading && isUnlocked && (
              <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-default md:hidden">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>End-to-end encrypted</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="hidden items-center gap-1.5 md:flex">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>End-to-end encrypted</span>
                </div>
              </div>
            )}

            <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
              <TooltipProvider>
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
              </TooltipProvider>
              <DialogContent>
                <DialogHeader className="pr-8">
                  <DialogTitle>About</DialogTitle>
                  <DialogDescription className="pt-2">
                    Your one-stop shop for Helvety software, subscriptions, and
                    apparel.
                  </DialogDescription>
                </DialogHeader>
                <>
                  <div className="border-t" />
                  <p className="text-muted-foreground text-xs">
                    {VERSION || "Unknown build time"}
                  </p>
                </>
                <DialogClose asChild>
                  <Button variant="outline" className="w-full">
                    Close
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="https://github.com/CasparRubin/helvety-store"
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
            </TooltipProvider>
          </div>

          <ThemeSwitcher />

          {/* Login button - only show when not authenticated */}
          {!isAuthenticated && (
            <Button variant="default" size="sm" onClick={handleLogin}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </Button>
          )}

          {isAuthenticated && (
            <>
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
                        href="/products"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Package className="h-4 w-4" />
                        Products
                      </Link>
                    </Button>
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
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link
                        href="/tenants"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Building2 className="h-4 w-4" />
                        Tenants
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
            </>
          )}

          {/* Burger menu - only below 400px */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="hidden max-[400px]:inline-flex">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                {!isLoading && isUnlocked && (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-green-500" />
                    <span>End-to-end encrypted</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAboutOpen(true);
                  }}
                >
                  <Info className="mr-2 h-4 w-4" />
                  About
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <a
                    href="https://github.com/CasparRubin/helvety-store"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Github className="mr-2 h-4 w-4" />
                    View source on GitHub
                  </a>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
