"use client";

import { urls } from "@helvety/shared/config";
import { cn } from "@helvety/shared/utils";
import {
  Grip,
  Home,
  FileText,
  ShoppingBag,
  KeyRound,
  CheckSquare,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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

/** Helvety ecosystem app URLs */
const apps = [
  { name: "Home", href: urls.home, icon: Home },
  { name: "Auth", href: urls.auth, icon: KeyRound },
  { name: "Store", href: urls.store, icon: ShoppingBag },
  { name: "PDF", href: urls.pdf, icon: FileText },
  { name: "Tasks", href: urls.tasks, icon: CheckSquare },
  { name: "Contacts", href: urls.contacts, icon: Users },
];

/** Props for the AppSwitcher component */
interface AppSwitcherProps {
  /** The name of the currently active app to highlight */
  currentApp?: string;
}

/**
 * App switcher component for navigating between Helvety ecosystem apps.
 * Displays a grid of available apps in a slide-out sheet.
 * Apps are listed in order: Home, Auth, Store, PDF, Tasks, Contacts.
 */
export function AppSwitcher({ currentApp }: AppSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Grip className="h-4 w-4" />
              <span className="sr-only">Switch apps</span>
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Helvety Ecosystem</p>
        </TooltipContent>
      </Tooltip>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Helvety Ecosystem</SheetTitle>
        </SheetHeader>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {apps.map((app) => {
            const Icon = app.icon;
            const isCurrent = currentApp === app.name;
            return (
              <a
                key={app.name}
                href={app.href}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-colors",
                  isCurrent
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent"
                )}
                onClick={() => setOpen(false)}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{app.name}</span>
              </a>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
