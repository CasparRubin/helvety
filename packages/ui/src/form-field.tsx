"use client";

import { cn } from "@helvety/shared/utils";
import { cloneElement, isValidElement, useId } from "react";

import { Label } from "./label";

import type { ReactElement, ReactNode } from "react";

/** Label-to-control spacing within one field group. */
export const FORM_FIELD_CLASS = "grid gap-2";

/** Props for a labeled form control (`grid gap-2`). */
export interface FormFieldProps {
  label: string;
  required?: boolean;
  id?: string;
  className?: string;
  children: ReactElement<{ id?: string }>;
}

/**
 * Label + control group with shared spacing. Clones `id` onto the child
 * control when the child accepts `id`.
 */
export function FormField({
  label,
  required,
  id: idProp,
  className,
  children,
}: FormFieldProps): React.JSX.Element {
  const autoId = useId();
  const fieldId = idProp ?? autoId;
  const control: ReactNode = isValidElement(children)
    ? cloneElement(children, { id: fieldId })
    : children;

  return (
    <div className={cn(FORM_FIELD_CLASS, className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required ? " *" : null}
      </Label>
      {control}
    </div>
  );
}
