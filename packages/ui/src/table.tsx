import { cn } from "@helvety/shared/utils";
import * as React from "react";

/** Responsive table root (no overflow wrapper; use LegalTableWrap or a parent scroll region). */
function Table({
  className,
  ...props
}: React.ComponentProps<"table">): React.JSX.Element {
  return (
    <table
      data-slot="table"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  );
}

/** Table header group. */
function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">): React.JSX.Element {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

/** Table body group. */
function TableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">): React.JSX.Element {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

/** Table footer group. */
function TableFooter({
  className,
  ...props
}: React.ComponentProps<"tfoot">): React.JSX.Element {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

/** Table row. */
function TableRow({
  className,
  ...props
}: React.ComponentProps<"tr">): React.JSX.Element {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  );
}

/** Table header cell. */
function TableHead({
  className,
  ...props
}: React.ComponentProps<"th">): React.JSX.Element {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-3 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  );
}

/** Table body cell. */
function TableCell({
  className,
  ...props
}: React.ComponentProps<"td">): React.JSX.Element {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-3 align-top whitespace-normal [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  );
}

/** Table caption. */
function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">): React.JSX.Element {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
