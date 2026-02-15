"use client";

/**
 * Store section navigation
 * Renders four links (Products, Account, Subscriptions, Tenants) below the navbar.
 * Desktop: horizontal flex row of link-buttons
 * Mobile: dropdown showing the active link as trigger
 */

import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { CommandBar } from "@helvety/ui/command-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@helvety/ui/dropdown-menu";
import {
  Package,
  User,
  CreditCard,
  Building2,
  ChevronDownIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/products", label: "Products", icon: Package },
  { href: "/account", label: "Account", icon: User },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/tenants", label: "Tenants", icon: Building2 },
];

/**
 * Renders the store section nav (Products, Account, Subscriptions, Tenants).
 */
export function StoreNav() {
  const pathname = usePathname();

  const getIsActive = (href: string) => {
    const isProducts = href === "/products";
    return isProducts
      ? pathname === "/products" || pathname.startsWith("/products/")
      : pathname === href;
  };

  const activeLink = links.find((l) => getIsActive(l.href)) ?? links[0]!;
  const ActiveIcon = activeLink.icon;

  return (
    <CommandBar>
      {/* Desktop: horizontal link row */}
      <div className="hidden items-center gap-1 md:flex">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = getIsActive(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile: dropdown showing active link */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 md:hidden">
            <ActiveIcon className="size-4" />
            <span>{activeLink.label}</span>
            <ChevronDownIcon className="ml-1 size-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = getIsActive(href);

            return (
              <DropdownMenuItem
                key={href}
                asChild
                className={cn(isActive && "bg-accent")}
              >
                <Link href={href}>
                  <Icon className="mr-2 size-4" />
                  <span>{label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </CommandBar>
  );
}
