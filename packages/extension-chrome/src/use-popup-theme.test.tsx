import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePopupTheme } from "./use-popup-theme";

const STORAGE_KEY = "helvety-extension-theme";

describe("usePopupTheme", () => {
  let store: Record<string, unknown>;
  let getMock: ReturnType<typeof vi.fn>;
  let setMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = {};
    getMock = vi.fn((key: string) => Promise.resolve({ [key]: store[key] }));
    setMock = vi.fn((items: Record<string, unknown>) => {
      Object.assign(store, items);
      return Promise.resolve();
    });
    vi.stubGlobal("chrome", {
      storage: { local: { get: getMock, set: setMock } },
    });
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads a stored preference and applies the theme class", async () => {
    store[STORAGE_KEY] = "dark";

    const { result } = renderHook(() => usePopupTheme(STORAGE_KEY));

    await waitFor(() => expect(result.current.themeLoaded).toBe(true));
    expect(result.current.themePreference).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("normalizes and persists a default when storage is empty", async () => {
    const { result } = renderHook(() => usePopupTheme(STORAGE_KEY));

    await waitFor(() => expect(result.current.themeLoaded).toBe(true));
    expect(setMock).toHaveBeenCalledWith({
      [STORAGE_KEY]: result.current.themePreference,
    });
  });

  it("does not rewrite storage when the stored value is already valid", async () => {
    store[STORAGE_KEY] = "light";

    const { result } = renderHook(() => usePopupTheme(STORAGE_KEY));

    await waitFor(() => expect(result.current.themeLoaded).toBe(true));
    expect(result.current.themePreference).toBe("light");
    expect(setMock).not.toHaveBeenCalled();
  });

  it("saveTheme updates state and writes the new preference", async () => {
    const { result } = renderHook(() => usePopupTheme(STORAGE_KEY));

    await waitFor(() => expect(result.current.themeLoaded).toBe(true));

    act(() => {
      result.current.saveTheme("dark");
    });

    expect(result.current.themePreference).toBe("dark");
    expect(store[STORAGE_KEY]).toBe("dark");
  });

  it("falls back to a valid default when storage rejects", async () => {
    getMock.mockRejectedValueOnce(new Error("storage unavailable"));

    const { result } = renderHook(() => usePopupTheme(STORAGE_KEY));

    await waitFor(() => expect(result.current.themeLoaded).toBe(true));
    expect(["light", "dark"]).toContain(result.current.themePreference);
  });
});
