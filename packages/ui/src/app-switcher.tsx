"use client";

import { cn } from "@helvety/shared/utils";
import { Grip } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AccessibleSheetHeader } from "./accessible-sheet-header";
import { appSwitcherSections } from "./app-switcher-sections";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import { Sheet, SheetContent } from "./sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/** Props for the AppSwitcher component. */
interface AppSwitcherProps {
  currentApp?: string;
}

/**
 * App switcher for navigating between helvety.com web apps, store entries, and related links.
 * Displays grouped sections of links in a slide-out sheet.
 *
 * Links keep **absolute** `urls.*` hrefs so **`next/link`** does not prepend the current app’s
 * Next.js **`basePath`** (`/auth`, `/store`, `/pdf`, …) to another zone’s path (which would yield
 * wrong targets like `/auth/pdf` and spurious RSC **404** prefetches).
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
          <p>Helvety apps and tools</p>
        </TooltipContent>
      </Tooltip>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col">
          <AccessibleSheetHeader
            className="shrink-0"
            title="Helvety apps and tools"
            description="Navigate between helvety.com web apps and related store links."
          />
          <ScrollArea className="mt-6 min-h-0 flex-1">
            <div className="space-y-5 px-1 pb-6">
              {appSwitcherSections.map((section) => (
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
