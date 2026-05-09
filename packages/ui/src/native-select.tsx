import { cn } from "@helvety/shared/utils";

import type { SelectHTMLAttributes } from "react";

/** Props for `NativeSelect`. */
type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Styled native select for consistent shadcn-adjacent form usage. */
export function NativeSelect({
  className,
  children,
  ...props
}: NativeSelectProps): React.JSX.Element {
  return (
    <select
      className={cn(
        "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
