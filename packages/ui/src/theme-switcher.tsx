"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@helvety/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@helvety/ui/tooltip";

/**
 * Theme toggle button for switching between light and dark modes.
 * Handles system preference by resolving to the actual displayed theme.
 */
export function ThemeSwitcher(): React.JSX.Element {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = (): void => {
    if (theme === "system") {
      setTheme((resolvedTheme ?? "light") === "dark" ? "light" : "dark");
    } else {
      setTheme(theme === "light" ? "dark" : "light");
    }
  };

  if (!mounted) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Sun className="h-4 w-4" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Toggle theme</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const isDark = (resolvedTheme ?? "light") === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Toggle theme</p>
      </TooltipContent>
    </Tooltip>
  );
}
