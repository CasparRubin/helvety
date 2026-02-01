/**
 * Feature list component
 * Displays a list of features with checkmark icons
 */

import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 *
 */
interface FeatureListProps {
  features: string[];
  className?: string;
  variant?: "default" | "compact";
}

/**
 *
 * @param root0
 * @param root0.features
 * @param root0.className
 * @param root0.variant
 */
export function FeatureList({
  features,
  className,
  variant = "default",
}: FeatureListProps) {
  return (
    <ul
      className={cn(
        "space-y-2",
        variant === "compact" && "space-y-1.5",
        className
      )}
    >
      {features.map((feature) => (
        <li
          key={feature}
          className={cn(
            "flex items-start gap-2",
            variant === "compact" && "text-sm"
          )}
        >
          <Check
            className={cn(
              "size-4 shrink-0 text-green-500 dark:text-green-400",
              variant === "default" && "mt-0.5"
            )}
          />
          <span className="text-muted-foreground">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 *
 */
interface FeatureComparisonProps {
  included: string[];
  excluded?: string[];
  className?: string;
}

/**
 *
 * @param root0
 * @param root0.included
 * @param root0.excluded
 * @param root0.className
 */
export function FeatureComparison({
  included,
  excluded = [],
  className,
}: FeatureComparisonProps) {
  return (
    <ul className={cn("space-y-2", className)}>
      {included.map((feature) => (
        <li key={`included-${feature}`} className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-green-500 dark:text-green-400" />
          <span className="text-muted-foreground">{feature}</span>
        </li>
      ))}
      {excluded.map((feature) => (
        <li key={`excluded-${feature}`} className="flex items-start gap-2">
          <X className="mt-0.5 size-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
          <span className="text-muted-foreground/60 line-through">
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}
