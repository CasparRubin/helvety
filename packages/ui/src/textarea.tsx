import { cn } from "@helvety/shared/utils";
import * as React from "react";

import { FORM_CONTROL_TEXT_SIZE_CLASS } from "./form-control-text-size";

/**
 *
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-2.5 py-2 shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3",
        FORM_CONTROL_TEXT_SIZE_CLASS,
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
