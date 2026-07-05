import { HelvetyIdentifier } from "@helvety/brand/identifier";
import { cn } from "@helvety/shared/utils";

import type { JSX } from "react";

/** Helvety identifier mark for About tab **Developer** sections. */
export function HelvetyMark({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <HelvetyIdentifier
      className={cn("h-8 w-8 shrink-0", className)}
      aria-hidden
    />
  );
}
