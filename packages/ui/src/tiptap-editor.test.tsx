"use client";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/** Chainable no-op stub for mocked Tiptap editor commands in unit tests. */
function createChainStub() {
  const chain: Record<string, unknown> = {
    run: () => true,
  };
  for (const method of [
    "focus",
    "toggleBold",
    "toggleItalic",
    "toggleUnderline",
    "toggleStrike",
    "toggleHeading",
    "setParagraph",
    "toggleBulletList",
    "toggleOrderedList",
    "undo",
    "redo",
    "extendMarkRange",
    "unsetLink",
    "setLink",
    "insertContent",
  ]) {
    chain[method] = () => chain;
  }
  return chain;
}

const mockEditor = {
  isEditable: true,
  isActive: () => false,
  chain: () => createChainStub(),
  can: () => ({ undo: () => true, redo: () => true }),
  getAttributes: () => ({ href: "" }),
  setEditable: vi.fn(),
  commands: {
    clearContent: vi.fn(),
    setContent: vi.fn(),
    focus: vi.fn(),
  },
  getJSON: () => ({}),
};

vi.mock("@tiptap/react", () => ({
  useEditor: () => mockEditor,
  EditorContent: () => null,
}));

import { TiptapEditor } from "./tiptap-editor";

describe("TiptapEditor toolbar accessibility", () => {
  it("exposes accessible names for icon-only toolbar buttons", async () => {
    render(<TiptapEditor content={null} />);

    expect(
      await screen.findByRole("button", { name: "Bold" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Strikethrough" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Link" })
    ).toBeInTheDocument();
  });
});
