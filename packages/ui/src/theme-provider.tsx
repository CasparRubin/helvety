"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

/**
 * next-themes wrapper. Its injected script is a data block so it does not
 * execute; FOUC is handled by the blocking {@link HelvetyThemeInitScript}.
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
        type: "application/json",
      }}
    >
      {children}
    </NextThemesProvider>
  );
}
