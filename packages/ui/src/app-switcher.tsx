"use client";

import { urls } from "@helvety/shared/config";
import { cn } from "@helvety/shared/utils";
import {
  Building2,
  FileText,
  Grip,
  House,
  ImageUp,
  ListTodo,
  Monitor,
  NotebookPen,
  Puzzle,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { type ComponentType, type SVGProps, useState } from "react";

import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/** Link item shown inside an ecosystem section. */
interface SectionLink {
  name: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
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
      { name: "Home", href: urls.home, icon: House },
      { name: "Store", href: urls.store, icon: Store },
    ],
  },
  {
    title: "Encryption Apps",
    links: [
      { name: "Tasks", href: urls.tasks, icon: ListTodo },
      { name: "Contacts", href: urls.contacts, icon: Users },
      { name: "Notes", href: urls.notes, icon: NotebookPen },
    ],
  },
  {
    title: "File Tools",
    links: [
      { name: "PDF", href: urls.pdf, icon: FileText },
      { name: "Image Upscaler", href: urls.imageUpscaler, icon: ImageUp },
    ],
  },
  {
    title: "Browser Extensions",
    links: [
      {
        name: "Power Automate Browser Extension",
        href: `${urls.store}/products/helvety-power-automate-force-v3-false`,
        icon: Puzzle,
      },
    ],
  },
  {
    title: "SharePoint Apps",
    links: [
      {
        name: "Helvety SPO Explorer",
        href: `${urls.store}/products/helvety-spo-explorer`,
        icon: Building2,
      },
    ],
  },
  {
    title: "Desktop Apps",
    links: [
      {
        name: "Helvety Screen Tools",
        href: `${urls.store}/products/helvety-screen-tools`,
        icon: Monitor,
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
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle>Helvety Ecosystem</SheetTitle>
            <SheetDescription className="sr-only">
              Select an app or tool from the Helvety ecosystem.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="mt-6 min-h-0 flex-1">
            <div className="space-y-5 px-1 pb-6">
              {sections.map((section) => (
                <section key={section.title} className="space-y-2">
                  <h3 className="text-muted-foreground px-2 text-xs font-semibold tracking-wide uppercase">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.links.map((link) => {
                      const isCurrent = currentApp === link.name;
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.name}
                          href={link.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                            isCurrent
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent"
                          )}
                          onClick={() => setOpen(false)}
                        >
                          <Icon
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{link.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
