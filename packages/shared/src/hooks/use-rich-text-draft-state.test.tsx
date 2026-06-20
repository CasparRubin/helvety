import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useRichTextDraftState } from "./use-rich-text-draft-state";

describe("use-rich-text-draft-state", () => {
  it("tracks dirty state and saved snapshots", () => {
    const { result } = renderHook(() => useRichTextDraftState());

    act(() => {
      result.current.initializeTitle("Original");
    });

    expect(result.current.isDirty("Original", null)).toBe(false);
    expect(result.current.isDirty("Changed", null)).toBe(true);

    act(() => {
      result.current.markSaved("Changed", '{"type":"doc"}');
    });

    expect(result.current.isDirty("Changed", '{"type":"doc"}')).toBe(false);
    expect(result.current.isDirty("Changed", '{"type":"other"}')).toBe(true);
  });

  it("captures editor baseline exactly once until reset", () => {
    const { result } = renderHook(() => useRichTextDraftState());

    expect(result.current.captureEditorBaseline('{"type":"doc"}')).toBe(true);
    expect(result.current.captureEditorBaseline('{"type":"other"}')).toBe(
      false
    );

    act(() => {
      result.current.resetDescriptionBaselineCapture();
    });

    expect(result.current.captureEditorBaseline('{"type":"reset"}')).toBe(true);
  });

  it("documents that re-initializing title baseline hides unsaved title edits", () => {
    const { result } = renderHook(() => useRichTextDraftState());

    act(() => {
      result.current.initializeTitle("Saved");
    });
    expect(result.current.isDirty("Dirty", null)).toBe(true);

    act(() => {
      result.current.initializeTitle("Dirty");
    });
    expect(result.current.isDirty("Dirty", null)).toBe(false);
  });
});
