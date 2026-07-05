"use client";

/**
 * Store section navigation: pinned below the navbar via
 * `scrollAreaMainPrefix` on `HelvetyPublicShellRootLayout` (outside main scroll).
 * Uses `CommandBar` `variant="solid"` for an opaque section toolbar.
 * Main navbar chrome stays opaque on `HelvetyShellNavbar`.
 * Desktop: horizontal flex row of link-buttons.
 * Mobile: dropdown showing the active link as trigger.
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
import { useNavbarAuthState } from "@helvety/ui/use-navbar-auth-state";
import {
  ChevronDownIcon,
  PackageIcon as Package,
  UserIcon as UserGlyph,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { User } from "@helvety/shared/supabase-types";

const PRODUCT_LINKS = [{ href: "/products", label: "Products", icon: Package }];

const ACCOUNT_LINK = {
  href: "/account",
  label: "Account",
  icon: UserGlyph,
};

/**
 * Renders the store section nav.
 * Account is only visible for authenticated users.
 */
export function StoreNav({
  initialUser = null,
}: {
  initialUser?: User | null;
}) {
  const pathname = usePathname();
  const { user } = useNavbarAuthState(initialUser);
  const isAuthenticated = Boolean(user);
  const links = isAuthenticated
    ? [...PRODUCT_LINKS, ACCOUNT_LINK]
    : PRODUCT_LINKS;

  const getIsActive = (href: string) => {
    const isProducts = href === "/products";
    return isProducts
      ? pathname === "/products" || pathname.startsWith("/products/")
      : pathname === href;
  };

  const activeLink = links.find((l) => getIsActive(l.href)) ?? links[0]!;
  const ActiveIcon = activeLink.icon;

  return (
    <CommandBar variant="solid">
      {/* Desktop: horizontal link row */}
      <div className="hidden items-center gap-1 md:flex">
        {links.map(({ href, label, icon }) => {
          const isActive = getIsActive(href);
          const IconComponent = icon;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <IconComponent className="size-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile: dropdown showing active link */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="gap-1.5 md:hidden" />
          }
        >
          <ActiveIcon className="size-4" />
          <span>{activeLink.label}</span>
          <ChevronDownIcon className="ml-1 size-3.5 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {links.map(({ href, label, icon }) => {
            const isActive = getIsActive(href);
            const IconComponent = icon;

            return (
              <DropdownMenuItem
                key={href}
                render={<Link href={href} />}
                nativeButton={false}
                className={cn(isActive && "bg-accent")}
              >
                <IconComponent className="mr-2 size-4" />
                <span>{label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </CommandBar>
  );
}
