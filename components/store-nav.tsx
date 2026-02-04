"use client";

/**
 * Store section navigation
 * Renders four links (Products, Account, Subscriptions, Tenants) below the navbar.
 */

import { Package, User, CreditCard, Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

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

  return (
    <nav
      className={
        "bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40 w-full border-b backdrop-blur"
      }
    >
      <div className="container mx-auto px-4 py-2 md:py-0">
        <div className="grid grid-cols-2 gap-1 md:flex md:h-12 md:items-center">
          {links.map(({ href, label, icon: Icon }) => {
            const isProducts = href === "/products";
            const isActive = isProducts
              ? pathname === "/products" || pathname.startsWith("/products/")
              : pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors md:justify-start",
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
      </div>
    </nav>
  );
}
