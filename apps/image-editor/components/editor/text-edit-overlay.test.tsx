import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createTextElement } from "@/lib/editor-reducer";

import { TextEditOverlay } from "./text-edit-overlay";

describe("TextEditOverlay", () => {
  it("positions the textarea using stage coordinates and display scale", () => {
    const element = createTextElement(100, 50, "#ffffff", {
      imageWidth: 1920,
      imageHeight: 1080,
      fontSize: 36,
    });

    render(
      <TextEditOverlay
        element={element}
        crop={{ x: 0, y: 0, width: 1920, height: 1080 }}
        displayScale={0.5}
        onCommit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveStyle({
      left: "50px",
      top: "25px",
      fontSize: "18px",
    });
    expect(textarea.style.textShadow).toContain("rgba(0,0,0,0.85)");
  });

  it("commits on blur and cancels on Escape", () => {
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    const element = createTextElement(0, 0);

    render(
      <TextEditOverlay
        element={element}
        crop={{ x: 0, y: 0, width: 800, height: 600 }}
        displayScale={1}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    );

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Updated" } });
    fireEvent.blur(textarea);
    expect(onCommit).toHaveBeenCalledWith("Updated");

    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
