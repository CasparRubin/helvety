import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readHtmlDarkTheme, useHtmlDarkTheme } from "./use-html-dark-theme";

describe("use-html-dark-theme", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("readHtmlDarkTheme reflects the html.dark class", () => {
    expect(readHtmlDarkTheme()).toBe(false);
    document.documentElement.classList.add("dark");
    expect(readHtmlDarkTheme()).toBe(true);
  });

  it("updates when next-themes toggles the html class", async () => {
    const { result } = renderHook(() => useHtmlDarkTheme());
    expect(result.current).toBe(false);

    act(() => {
      document.documentElement.classList.add("dark");
    });
    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    act(() => {
      document.documentElement.classList.remove("dark");
    });
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
