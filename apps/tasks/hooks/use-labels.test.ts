import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DEFAULT_LABEL_CONFIG } from "@/lib/config/default-labels";

import { useLabels } from "./use-labels";

describe("useLabels", () => {
  it("returns default labels for the built-in config id", () => {
    const { result } = renderHook(() => useLabels(DEFAULT_LABEL_CONFIG.id));

    expect(result.current.isDefaultConfig).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.labels.length).toBeGreaterThan(0);
    expect(result.current.labels[0]?.config_id).toBe(DEFAULT_LABEL_CONFIG.id);
  });

  it("returns an empty list for unknown config ids", () => {
    const { result } = renderHook(() => useLabels("custom-config"));

    expect(result.current.labels).toEqual([]);
    expect(result.current.isDefaultConfig).toBe(false);
  });
});
