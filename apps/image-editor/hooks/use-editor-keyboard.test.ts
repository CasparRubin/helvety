import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useEditorKeyboard } from "./use-editor-keyboard";

describe("useEditorKeyboard", () => {
  it("calls onDelete for Delete and Backspace when enabled", () => {
    const onDelete = vi.fn();
    const onEscape = vi.fn();

    renderHook(() => useEditorKeyboard({ enabled: true, onDelete, onEscape }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));

    expect(onDelete).toHaveBeenCalledTimes(2);
  });

  it("calls onEscape for Escape when enabled", () => {
    const onDelete = vi.fn();
    const onEscape = vi.fn();

    renderHook(() => useEditorKeyboard({ enabled: true, onDelete, onEscape }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("ignores shortcuts when disabled", () => {
    const onDelete = vi.fn();
    const onEscape = vi.fn();

    renderHook(() => useEditorKeyboard({ enabled: false, onDelete, onEscape }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("ignores shortcuts while focus is in a text field", () => {
    const onDelete = vi.fn();
    const onEscape = vi.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useEditorKeyboard({ enabled: true, onDelete, onEscape }));

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Delete", bubbles: true })
    );

    expect(onDelete).not.toHaveBeenCalled();
    input.remove();
  });
});
