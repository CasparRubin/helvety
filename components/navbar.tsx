"use client";

import {
  Building2,
  FileText,
  Scale,
  Menu,
  Github,
  Info,
  LogIn,
  LogOut,
  User as UserIcon,
  Settings,
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
  DialogTrigger,
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
import { createClient } from "@/lib/supabase/client";

import type { User } from "@supabase/supabase-js";

/**
 * Main navigation bar component for helvety.com
 *
 * Features:
 * - App switcher for navigating between Helvety ecosystem apps
 * - Logo and branding
 * - Navigation links (Impressum, Privacy, Terms)
 * - About dialog with version info
 * - GitHub link
 * - Theme switcher (dark/light mode)
 * - Login button (shown when user is not authenticated)
 * - Mobile responsive with burger menu
 */
export function Navbar() {
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };
    void getUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleLogin = () => {
    redirectToLogin();
  };

  const handleLogout = () => {
    redirectToLogout();
  };

  const navLinks = [
    { href: "/impressum", label: "Impressum", icon: Building2 },
    { href: "/privacy", label: "Privacy", icon: Scale },
    { href: "/terms", label: "Terms", icon: FileText },
  ];

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* App Switcher + Logo */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AppSwitcher currentApp="Home" />
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-80"
            aria-label="Go to home"
          >
            <Image
              src="/logo_whiteBg.svg"
              alt="Helvety"
              width={120}
              height={30}
              className="hidden h-8 w-auto sm:block"
              priority
            />
            <Image
              src="/Identifier_whiteBg.svg"
              alt="Helvety"
              width={30}
              height={30}
              className="h-8 w-auto sm:hidden"
              priority
            />
          </Link>
          <span className="shrink-0 text-xl font-black tracking-tight">
            by Rubin
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Desktop navigation links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Button key={link.href} variant="ghost" size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>

          {/* About button */}
          <Dialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Info className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
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
                  The main Helvety website. Swiss Engineering.
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

          {/* GitHub icon - always visible */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/CasparRubin/helvety.com"
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

          <ThemeSwitcher />

          {/* Login button - only show when not authenticated */}
          {!user && !isLoading && (
            <Button variant="default" size="sm" onClick={handleLogin}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </Button>
          )}

          {/* Profile menu - only show when authenticated */}
          {user && !isLoading && (
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
                      <PopoverTitle>Account</PopoverTitle>
                      <PopoverDescription className="truncate">
                        {user.email ?? "Signed in"}
                      </PopoverDescription>
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

          {/* Mobile burger menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
