import { cn } from "@helvety/shared/utils";
import * as React from "react";

import { FORM_CONTROL_TEXT_SIZE_CLASS } from "./form-control-text-size";

/** Multi-line text field styled like Input. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex min-h-[4.5rem] w-full rounded-md border px-3 py-2 shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-[3px]",
        FORM_CONTROL_TEXT_SIZE_CLASS,
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
