"use client"

import { Building2, FileText, Scale, Menu, Github, Info } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { AppSwitcher } from "@/components/app-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { VERSION } from "@/lib/config/version"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "/impressum", label: "Impressum", icon: Building2 },
    { href: "/privacy", label: "Privacy", icon: Scale },
    { href: "/terms", label: "Terms", icon: FileText },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* App Switcher + Logo */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <AppSwitcher currentApp="Home" />
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <Image
              src="/logo_whiteBg.svg"
              alt="Helvety"
              width={120}
              height={30}
              className="h-8 w-auto hidden sm:block"
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
          <span className="text-xl font-black tracking-tight shrink-0">
            by Rubin
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop navigation links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button key={link.href} variant="ghost" size="sm" asChild>
                <Link href={link.href}>
                  {link.label}
                </Link>
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
                <p className="text-xs text-muted-foreground">
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
              <nav className="flex flex-col gap-2 mt-6">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  )
                })}
                <a
                  href="https://github.com/CasparRubin/helvety.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
