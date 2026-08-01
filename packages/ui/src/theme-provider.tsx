"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

/**
 * next-themes wrapper. On the client, marks its injected script as a data
 * block so React 19 does not warn; FOUC is handled by HelvetyThemeInitScript.
 */
export function ThemeProvider({
  children,
  scriptProps,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      {...props}
      scriptProps={{
        ...scriptProps,
        ...(typeof window !== "undefined"
          ? { type: "application/json" as const }
          : null),
      }}
    >
      {children}
    </NextThemesProvider>
  );
}
