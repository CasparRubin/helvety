"use client";

import { cn } from "@helvety/shared/utils";
import { SearchIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "./button";
import { Input } from "./input";

/** Controlled search input for in-memory list filtering (E2EE-friendly). */
export interface ListSearchFieldProps extends Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Search field for client-side list filtering: wraps shared Input + leading icon;
 * optional clear aligns with Helvety / shadcn tokens (no extra radii or shadows).
 */
export function ListSearchField({
  className,
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
  ...inputProps
}: ListSearchFieldProps): React.JSX.Element {
  const showClear = value.length > 0;

  const handleClear = React.useCallback(() => {
    onChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  }, [onChange]);

  return (
    <div className={cn("relative w-full max-w-md", className)} role="search">
      <SearchIcon
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        id={id}
        type="search"
        autoComplete="off"
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className={cn("pl-9", showClear && "pr-10")}
        {...inputProps}
      />
      {showClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0.5 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <XIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
