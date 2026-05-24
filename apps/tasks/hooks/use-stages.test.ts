import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DEFAULT_STAGE_CONFIGS } from "@/lib/config/default-stages";

import { useStages } from "./use-stages";

describe("useStages", () => {
  it("returns default stages for the built-in item config id", () => {
    const { result } = renderHook(() =>
      useStages(DEFAULT_STAGE_CONFIGS.item.id)
    );

    expect(result.current.isDefaultConfig).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.stages.length).toBeGreaterThan(0);
    expect(result.current.stages[0]?.config_id).toBe(
      DEFAULT_STAGE_CONFIGS.item.id
    );
  });

  it("returns an empty list for unknown config ids", () => {
    const { result } = renderHook(() => useStages("custom-config"));

    expect(result.current.stages).toEqual([]);
    expect(result.current.isDefaultConfig).toBe(false);
  });
});
