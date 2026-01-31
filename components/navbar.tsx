"use client";

import {
  LogOut,
  ShieldCheck,
  User,
  Building2,
  Scale,
  FileText,
  Menu,
  Github,
  Info,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AppSwitcher } from "@/components/app-switcher";
import { SubscriptionsSheet } from "@/components/subscriptions-sheet";
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
import { VERSION } from "@/lib/config/version";
import { useEncryptionContext } from "@/lib/crypto/encryption-context";
import { useNavigation } from "@/lib/navigation-helpers";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const { navigate } = useNavigation();
  const { isUnlocked } = useEncryptionContext();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [subscriptionsSheetOpen, setSubscriptionsSheetOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
      setIsAuthenticated(!!user);
    };
    void getUser();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Navigate to login page (prefetching handled by navigate)
    navigate("/login", { immediate: true });
  };

  const footerLinks = [
    {
      href: "https://helvety.com/impressum",
      label: "Impressum",
      icon: Building2,
    },
    { href: "https://helvety.com/privacy", label: "Privacy", icon: Scale },
    { href: "https://helvety.com/terms", label: "Terms", icon: FileText },
  ];

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
          {/* E2EE indicator - only show when encryption is unlocked */}
          {isUnlocked && (
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              {/* Mobile: icon with tooltip */}
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
              {/* Desktop: icon + text */}
              <div className="hidden items-center gap-1.5 md:flex">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
          )}

          {/* Desktop navigation links */}
          <div className="hidden items-center gap-1 md:flex">
            {footerLinks.map((link) => (
              <Button key={link.href} variant="ghost" size="sm" asChild>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
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

          {/* GitHub icon - always visible */}
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

          <ThemeSwitcher />

          {isAuthenticated && (
            <>
              <Popover open={profileOpen} onOpenChange={setProfileOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <PopoverHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                        <User className="text-primary h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <PopoverTitle>Account</PopoverTitle>
                        {userEmail && (
                          <PopoverDescription className="truncate">
                            {userEmail}
                          </PopoverDescription>
                        )}
                      </div>
                    </div>
                  </PopoverHeader>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setProfileOpen(false);
                        setSubscriptionsSheetOpen(true);
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                      My Subscriptions
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => {
                        setProfileOpen(false);
                        void handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Subscriptions sheet - accessible from profile popover */}
              <SubscriptionsSheet
                open={subscriptionsSheetOpen}
                onOpenChange={setSubscriptionsSheetOpen}
              />
            </>
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
                {/* Navigation links */}
                {footerLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </a>
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
