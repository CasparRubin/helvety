"use client";

// Next.js
import {
  Github,
  Building2,
  Menu,
  Info,
  LogIn,
  LogOut,
  Crown,
  User as UserIcon,
  ShoppingBag,
  Check,
  Settings,
  Package,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Internal components
import { AppSwitcher } from "@/components/app-switcher";
import { useSubscriptionContext } from "@/components/subscription-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Badge } from "@/components/ui/badge";
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
 * Main navigation bar component for helvety-pdf
 *
 * Features:
 * - App switcher for navigating between Helvety ecosystem apps
 * - Logo and branding with "PDF" label
 * - E2EE indicator, About dialog, GitHub link (in bar above 400px; in burger below 400px)
 * - Theme switcher (dark/light mode)
 * - Login button (shown when user is not authenticated)
 * - Profile menu with user email, subscription tier, upgrade prompt, store links (Products, Account, Subscriptions, Tenants), and Sign out (shown when authenticated)
 * - Burger menu below 400px: E2EE, About, GitHub plus login/user/upgrade/logout sections
 */
export function Navbar() {
  const { isUnlocked, isLoading: encryptionLoading } = useEncryptionContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { isAuthenticated, isPro, isLoading } = useSubscriptionContext();
  const supabase = createClient();

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

  const handleLogin = () => {
    redirectToLogin();
  };

  const handleLogout = () => {
    // Redirect to centralized auth service for logout
    redirectToLogout(window.location.origin);
  };

  return (
    <TooltipProvider>
      <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
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
              className="text-xl font-black tracking-tight transition-opacity hover:opacity-80"
            >
              PDF
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/* E2EE, About, GitHub - hidden below 400px (moved into burger) */}
            <div className="hidden items-center gap-2 min-[401px]:flex">
              {!encryptionLoading && isUnlocked && (
                <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
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
                  <div className="hidden items-center gap-1.5 md:flex">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <span>End-to-end encrypted</span>
                  </div>
                </div>
              )}

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
                      A comprehensive PDF tool for merging, reordering,
                      rotating, and extracting pages. All processing happens
                      locally in your browser - private and secure.
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
            </div>

            <ThemeSwitcher />

            {/* Login button - only show when not authenticated */}
            {!isAuthenticated && !isLoading && (
              <Button variant="default" size="sm" onClick={handleLogin}>
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            )}

            {/* User profile popover - only show when authenticated */}
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
                  {/* Tier badge and upgrade section */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isPro ? "default" : "secondary"}>
                        {isPro ? (
                          <>
                            <Crown className="mr-1 h-3 w-3" />
                            Pro
                          </>
                        ) : (
                          "Basic"
                        )}
                      </Badge>
                    </div>
                    {!isPro && (
                      <div className="bg-muted/50 rounded-lg border p-3">
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                          <Crown className="h-4 w-4" />
                          Upgrade to Pro
                        </h4>
                        <ul className="mb-3 space-y-1">
                          {[
                            "Unlimited file uploads",
                            "Unlimited pages",
                            "Rotate pages",
                            "All merge & split features",
                            "Client-side processing",
                            "Priority support",
                          ].map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center gap-2 text-xs"
                            >
                              <Check className="text-primary h-3 w-3 shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <p className="text-muted-foreground mb-3 text-xs">
                          Only{" "}
                          <span className="text-foreground font-medium">
                            CHF 4.95/month
                          </span>
                        </p>
                        <Button
                          variant="default"
                          className="w-full justify-start"
                          size="sm"
                          asChild
                        >
                          <a
                            href="https://store.helvety.com/products/helvety-pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ShoppingBag className="h-4 w-4" />
                            Upgrade Now
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href="https://store.helvety.com/products"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Package className="h-4 w-4" />
                        Products
                      </a>
                    </Button>
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
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href="https://store.helvety.com/tenants"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Building2 className="h-4 w-4" />
                        Tenants
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
                <nav className="mt-6 flex flex-col gap-2 px-4">
                  {/* E2EE, About, GitHub - in burger below 400px */}
                  {!encryptionLoading && isUnlocked && (
                    <div className="text-muted-foreground flex h-9 items-center gap-2 px-2.5 text-sm">
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
                      View source code on GitHub
                    </a>
                  </Button>
                  <Separator />
                  {/* Login button in mobile menu */}
                  {!isAuthenticated && !isLoading && (
                    <Button
                      variant="default"
                      className="mb-2 w-full justify-start"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogin();
                      }}
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </Button>
                  )}
                  {/* User info section in mobile menu */}
                  {isAuthenticated && !isLoading && (
                    <>
                      <div className="mb-2 flex h-9 items-center gap-2 border-b px-2.5 pb-2">
                        <UserIcon className="text-muted-foreground h-4 w-4" />
                        <span className="text-muted-foreground text-sm">
                          Signed in
                        </span>
                        <Badge
                          variant={isPro ? "default" : "secondary"}
                          className="ml-auto"
                        >
                          {isPro ? (
                            <>
                              <Crown className="mr-1 h-3 w-3" />
                              Pro
                            </>
                          ) : (
                            "Basic"
                          )}
                        </Badge>
                      </div>
                      {!isPro && (
                        <div className="bg-muted/50 rounded-lg border p-3">
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                            <Crown className="h-4 w-4" />
                            Upgrade to Pro
                          </h4>
                          <ul className="mb-3 space-y-1">
                            {[
                              "Unlimited file uploads",
                              "Unlimited pages",
                              "Rotate pages",
                              "All merge & split features",
                              "Client-side processing",
                              "Priority support",
                            ].map((feature) => (
                              <li
                                key={feature}
                                className="flex items-center gap-2 text-xs"
                              >
                                <Check className="text-primary h-3 w-3 shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <p className="text-muted-foreground mb-3 text-xs">
                            Only{" "}
                            <span className="text-foreground font-medium">
                              CHF 4.95/month
                            </span>
                          </p>
                          <Button
                            variant="default"
                            className="w-full"
                            size="sm"
                            asChild
                          >
                            <a
                              href="https://store.helvety.com/products/helvety-pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <ShoppingBag className="h-4 w-4" />
                              Upgrade Now
                            </a>
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  {/* Logout button in mobile menu */}
                  {isAuthenticated && !isLoading && (
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
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
