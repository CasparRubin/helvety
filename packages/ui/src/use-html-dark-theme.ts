"use client";

import * as React from "react";

/** Reads whether `next-themes` has applied the `dark` class on `<html>`. */
export function readHtmlDarkTheme(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.documentElement.classList.contains("dark");
}

/** Subscribes to `class` changes on `<html>` (next-themes `attribute: "class"`). */
function subscribeHtmlDarkTheme(onStoreChange: () => void): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

/**
 * True when the resolved theme is dark (`html.dark`).
 * Works outside `ThemeProvider` (e.g. Store navbar-only scope) when client code must read
 * `html.dark` for the gateway Hyperspeed hero or other theme-aware UI.
 */
export function useHtmlDarkTheme(): boolean {
  return React.useSyncExternalStore(
    subscribeHtmlDarkTheme,
    readHtmlDarkTheme,
    () => false
  );
}
