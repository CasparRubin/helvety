/**
 * Feature list component
 * Displays a list of features with checkmark icons
 */

import { cn } from "@helvety/shared/utils";
import { Check } from "lucide-react";

/** Props for the FeatureList component. */
interface FeatureListProps {
  features: string[];
  className?: string;
  variant?: "default" | "compact";
}

/** Renders a checklist of included features. */
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
