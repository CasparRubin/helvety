"use client";

/**
 * Product filters component - filter products by ecosystem category
 * Desktop: inline button row with active state and optional counts
 * Mobile: dropdown menu showing active filter with selection list
 */

import {
  HELVETY_ECOSYSTEM_PRODUCT_SECTIONS,
  type HelvetyEcosystemCategorySlug,
  type HelvetyEcosystemSection,
} from "@helvety/shared/helvety-ecosystem-sections";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@helvety/ui/dropdown-menu";
import {
  Building2,
  ChevronDownIcon,
  FileText,
  LayoutGrid,
  Monitor,
  Puzzle,
  ShieldCheck,
} from "lucide-react";

/** Product category filter including the "all" option. */
export type FilterType = "all" | HelvetyEcosystemCategorySlug;

/** Props for the ProductFilters component. */
interface ProductFiltersProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
  className?: string;
  /** Show product counts next to filter labels */
  counts?: Record<FilterType, number>;
}

const categoryIcons: Record<HelvetyEcosystemCategorySlug, typeof ShieldCheck> =
  {
    "encryption-apps": ShieldCheck,
    "file-tools": FileText,
    "browser-extensions": Puzzle,
    "sharepoint-apps": Building2,
    "desktop-apps": Monitor,
  };

const filterOptions: {
  value: FilterType;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { value: "all", label: "All Products", icon: LayoutGrid },
  ...HELVETY_ECOSYSTEM_PRODUCT_SECTIONS.map(
    (section: HelvetyEcosystemSection) => ({
      value: section.slug,
      label: section.title,
      icon: categoryIcons[section.slug],
    })
  ),
];

/** Renders the product category filter bar (desktop) or dropdown (mobile). */
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
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="gap-1.5 md:hidden" />
          }
        >
          <ActiveIcon className="size-4" />
          <span>{activeOption.label}</span>
          <ChevronDownIcon className="ml-1 size-3.5 opacity-50" />
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
