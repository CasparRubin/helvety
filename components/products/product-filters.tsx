"use client";

/**
 * Product filters component
 * Allows filtering products by type and category
 */

import { Download, Package, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ProductType } from "@/lib/types/products";

export type FilterType = ProductType | "all";

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
  { value: "software", label: "Software", icon: Download },
  { value: "physical", label: "Physical", icon: Package },
];

export function ProductFilters({
  value,
  onChange,
  className,
  counts,
}: ProductFiltersProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
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
  );
}

interface ProductFiltersCompactProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
  className?: string;
}

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
