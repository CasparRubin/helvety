"use client";

/**
 * Product filters component - filter products by type
 * Desktop: inline button row with active state and optional counts
 * Mobile: dropdown menu showing active filter with selection list
 */

import {
  ChevronDownIcon,
  MonitorCloud,
  Handbag,
  LayoutGrid,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { ProductType } from "@/lib/types/products";

/** Product type filter including the "all" option. */
export type FilterType = ProductType | "all";

/** Props for the ProductFilters component. */
interface ProductFiltersProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
  className?: string;
  /** Show product counts next to filter labels */
  counts?: Record<FilterType, number>;
}

const filterOptions: {
  value: FilterType;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { value: "all", label: "All Products", icon: LayoutGrid },
  { value: "software", label: "Software", icon: MonitorCloud },
  { value: "physical", label: "Physical", icon: Handbag },
];

/** Renders the product type filter bar (desktop) or dropdown (mobile). */
export function ProductFilters({
  value,
  onChange,
  className,
  counts,
}: ProductFiltersProps) {
  const activeOption =
    filterOptions.find((o) => o.value === value) ?? filterOptions[0]!;
  const ActiveIcon = activeOption.icon;

  return (
    <div className={cn("flex items-center", className)}>
      {/* Desktop: full button row */}
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        {filterOptions.map((option) => {
          const Icon = option.icon;
          const count = counts?.[option.value];
          const isActive = value === option.value;

          return (
            <Button
              key={option.value}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onChange(option.value)}
              className={cn("gap-1.5", isActive && "bg-secondary")}
            >
              <Icon className="size-4" />
              <span>{option.label}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.5 text-xs",
                    isActive
                      ? "bg-secondary-foreground/10 text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Mobile: dropdown showing active filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 md:hidden">
            <ActiveIcon className="size-4" />
            <span>{activeOption.label}</span>
            <ChevronDownIcon className="ml-1 size-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            const count = counts?.[option.value];
            const isActive = value === option.value;

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(isActive && "bg-accent")}
              >
                <Icon className="mr-2 size-4" />
                <span>{option.label}</span>
                {count !== undefined && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    {count}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Props for the ProductFiltersCompact component. */
interface ProductFiltersCompactProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
  className?: string;
}

/** Renders a compact segmented-control style filter (icons only on mobile). */
export function ProductFiltersCompact({
  value,
  onChange,
  className,
}: ProductFiltersCompactProps) {
  return (
    <div
      className={cn(
        "bg-muted inline-flex items-center rounded-lg p-1",
        className
      )}
    >
      {filterOptions.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
