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

const setOptions = vi.fn();
const setEditable = vi.fn();

const mockEditor = {
  isEditable: true,
  isActive: () => false,
  chain: () => createChainStub(),
  can: () => ({ undo: () => true, redo: () => true }),
  getAttributes: () => ({ href: "" }),
  setOptions,
  setEditable,
  commands: {
    clearContent: vi.fn(),
    setContent: vi.fn(),
    focus: vi.fn(),
  },
  getJSON: () => ({}),
  options: {
    content: { type: "doc", content: [] },
    extensions: [],
    editorProps: {},
    editable: true,
  },
};

let latestUseEditorOptions: Record<string, unknown> | undefined;

vi.mock("@tiptap/react", () => ({
  useEditor: (options: Record<string, unknown>) => {
    latestUseEditorOptions = options;
    return mockEditor;
  },
  useEditorState: () => 0,
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

  it("mounts with a placeholder without throwing (TipTap 3.26 viewport tracking)", async () => {
    render(
      <TiptapEditor content={null} placeholder="Write something meaningful…" />
    );

    expect(
      await screen.findByRole("button", { name: "Bold" })
    ).toBeInTheDocument();
  });
});

describe("TiptapEditor option stability", () => {
  it("uses mount-only content and disables transaction re-renders", () => {
    const initial = { type: "doc", content: [{ type: "paragraph" }] };
    render(<TiptapEditor content={initial} />);

    expect(latestUseEditorOptions?.shouldRerenderOnTransaction).toBe(false);
    expect(latestUseEditorOptions?.content).toBeDefined();
  });

  it("keeps a stable extensions reference across parent re-renders", () => {
    const initial = { type: "doc", content: [{ type: "paragraph" }] };

    const { rerender } = render(
      <TiptapEditor content={initial} placeholder="First" />
    );
    const firstExtensions = latestUseEditorOptions?.extensions;

    rerender(<TiptapEditor content={initial} placeholder="First" />);

    expect(latestUseEditorOptions?.extensions).toBe(firstExtensions);
  });

  it("does not push a new content prop into useEditor on parent re-render", () => {
    const initial = { type: "doc", content: [{ type: "paragraph" }] };
    const stale = {
      type: "doc",
      content: [{ type: "heading", attrs: { level: 1 } }],
    };

    const { rerender } = render(<TiptapEditor content={initial} />);
    const firstContent = latestUseEditorOptions?.content;

    rerender(<TiptapEditor content={stale} />);

    expect(latestUseEditorOptions?.content).toBe(firstContent);
    expect(setOptions).not.toHaveBeenCalled();
  });
});

describe("TiptapEditor source invariants", () => {
  it("documents mount-only content and toolbar subscription", async () => {
    const { readFileSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "tiptap-editor.tsx"),
      "utf8"
    );
    expect(source).toContain("initialContentRef");
    expect(source).toContain("shouldRerenderOnTransaction: false");
    expect(source).toContain("useEditorState");
    expect(source).toContain("const extensions = useMemo");
  });
});
