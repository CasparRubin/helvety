"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 *
 */
function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>): React.JSX.Element {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

/**
 *
 */
function AlertDialogTrigger({
  ...props
}: React.ComponentProps<
  typeof AlertDialogPrimitive.Trigger
>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

/**
 *
 */
function AlertDialogPortal({
  ...props
}: React.ComponentProps<
  typeof AlertDialogPrimitive.Portal
>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

/**
 *
 */
function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<
  typeof AlertDialogPrimitive.Overlay
>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props}
    />
  );
}

/**
 *
 */
function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<
  typeof AlertDialogPrimitive.Content
>): React.JSX.Element {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl p-6 text-sm ring-1 duration-100 sm:max-w-md",
          className
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
}

/**
 *
 */
function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

/**
 *
 */
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

/**
 *
 */
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("leading-none font-medium", className)}
      {...props}
    />
  );
}

/**
 *
 */
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<
  typeof AlertDialogPrimitive.Description
>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/**
 *
 */
function AlertDialogAction({
  className,
  children,
  ...props
}: React.ComponentProps<
  typeof AlertDialogPrimitive.Action
>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Action asChild>
      <Button variant="destructive" className={className} {...props}>
        {children}
      </Button>
    </AlertDialogPrimitive.Action>
  );
}

/**
 *
 */
function AlertDialogCancel({
  className,
  children,
  ...props
}: React.ComponentProps<
  typeof AlertDialogPrimitive.Cancel
>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <Button variant="outline" className={className} {...props}>
        {children}
      </Button>
    </AlertDialogPrimitive.Cancel>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
