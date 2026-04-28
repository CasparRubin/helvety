"use client";

import { urls } from "@helvety/shared/config";
import { cn } from "@helvety/shared/utils";
import { Grip } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@helvety/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@helvety/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@helvety/ui/tooltip";

/** Link item shown inside an ecosystem section. */
interface SectionLink {
  name: string;
  href: string;
}

/** Group of ecosystem links rendered with a section heading. */
interface AppSection {
  title: string;
  links: SectionLink[];
}

const sections: AppSection[] = [
  {
    title: "Core Apps",
    links: [
      { name: "Home", href: urls.home },
      { name: "Auth", href: urls.auth },
      { name: "Store", href: urls.store },
    ],
  },
  {
    title: "Encryption Apps",
    links: [
      { name: "Tasks", href: urls.tasks },
      { name: "Contacts", href: urls.contacts },
      { name: "Notes", href: urls.notes },
    ],
  },
  {
    title: "File Tools",
    links: [
      { name: "PDF", href: urls.pdf },
      { name: "Image Upscaler", href: urls.imageUpscaler },
    ],
  },
  {
    title: "Browser Extensions",
    links: [
      {
        name: "Power Automate Browser Extension",
        href: `${urls.store}/products/helvety-power-automate-force-v3-false`,
      },
    ],
  },
  {
    title: "SharePoint Apps",
    links: [
      {
        name: "Helvety SPO Explorer",
        href: `${urls.store}/products/helvety-spo-explorer`,
      },
    ],
  },
  {
    title: "Desktop Apps",
    links: [
      {
        name: "Helvety Screen Tools",
        href: `${urls.store}/products/helvety-screen-tools`,
      },
    ],
  },
];

/** Props for the AppSwitcher component. */
interface AppSwitcherProps {
  currentApp?: string;
}

/**
 * App switcher for navigating between Helvety ecosystem apps and tools.
 * Displays grouped sections of links in a slide-out sheet.
 */
export function AppSwitcher({ currentApp }: AppSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setOpen(true)}
          >
            <Grip className="h-4 w-4" />
            <span className="sr-only">Switch apps</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Helvety Ecosystem</p>
        </TooltipContent>
      </Tooltip>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Helvety Ecosystem</SheetTitle>
            <SheetDescription className="sr-only">
              Select an app or tool from the Helvety ecosystem.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            {sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.links.map((link) => {
                    const isCurrent = currentApp === link.name;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={cn(
                          "block rounded-md px-2 py-1.5 text-sm transition-colors",
                          isCurrent
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
