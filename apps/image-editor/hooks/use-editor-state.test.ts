import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createTextElement } from "@/lib/editor-reducer";

import { useEditorState } from "./use-editor-state";

describe("useEditorState", () => {
  it("exposes reducer state and memoized action helpers", () => {
    const { result } = renderHook(() => useEditorState());

    expect(result.current.state.activeTool).toBe("select");
    expect(result.current.state.elements).toHaveLength(0);

    act(() => {
      result.current.setTool("text");
    });
    expect(result.current.state.activeTool).toBe("text");

    const text = createTextElement(4, 8);
    act(() => {
      result.current.dispatch({ type: "ADD_ELEMENT", element: text });
    });
    expect(result.current.state.elements).toHaveLength(1);
    expect(result.current.state.selectedId).toBe(text.id);

    act(() => {
      result.current.resetAnnotations();
    });
    expect(result.current.state.elements).toHaveLength(0);
    expect(result.current.state.crop).toBeNull();
  });
});
