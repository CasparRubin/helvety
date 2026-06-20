"use client";

import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import * as React from "react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  E2eeRichTextItemEditorShell,
  useE2eeRichTextItemEditorSave,
} from "./e2ee-item-editor-shell";

import type { JSONContent } from "@tiptap/react";

const { EMPTY_DOC, EDITED_DOC, EDITED_AGAIN_DOC } = vi.hoisted(() => ({
  EMPTY_DOC: { type: "doc", content: [] } satisfies JSONContent,
  EDITED_DOC: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "edited body" }],
      },
    ],
  } satisfies JSONContent,
  EDITED_AGAIN_DOC: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "edited body again" }],
      },
    ],
  } satisfies JSONContent,
}));

/** Imperative handle stub for mocked `TiptapEditor` in shell tests. */
type MockTiptapEditorHandle = {
  getJSON: () => JSONContent;
  setContent: (content: JSONContent | string | null) => void;
  focus: () => void;
  getEditor: () => null;
};

vi.mock("next/dynamic", () => {
  const MockTiptapEditor = React.forwardRef<
    MockTiptapEditorHandle,
    { onChange?: (content: JSONContent) => void }
  >(({ onChange }, ref) => {
    const [json, setJson] = React.useState<JSONContent>(EMPTY_DOC);
    const [editCount, setEditCount] = React.useState(0);

    React.useImperativeHandle(ref, () => ({
      getJSON: () => json,
      setContent: (content) => {
        if (content === null) {
          setJson(EMPTY_DOC);
          return;
        }
        if (typeof content === "object") {
          setJson(content);
        }
      },
      focus: () => undefined,
      getEditor: () => null,
    }));

    return React.createElement(
      "button",
      {
        type: "button",
        "data-testid": "mock-tiptap-edit",
        onClick: () => {
          const next = editCount === 0 ? EDITED_DOC : EDITED_AGAIN_DOC;
          setEditCount((count) => count + 1);
          setJson(next);
          onChange?.(next);
        },
      },
      "Edit body"
    );
  });
  MockTiptapEditor.displayName = "MockTiptapEditor";

  return {
    default: () => MockTiptapEditor,
  };
});

describe("E2eeRichTextItemEditorShell", () => {
  const onSave = vi.fn(async () => true);
  const onRefresh = vi.fn(async () => undefined);
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSave when the command bar save action runs", () => {
    render(
      <E2eeRichTextItemEditorShell
        editorSessionKey="test-item"
        title="Hello"
        description={null}
        isLoading={false}
        hasItem
        error={null}
        hasInitialized
        onTitleChange={vi.fn()}
        onSave={onSave}
        onRefresh={onRefresh}
        onBack={onBack}
        titlePlaceholder="Title"
        notFoundMessage="Not found"
        loadErrorMessage="Load failed"
        renderCommandBar={({ onSave: save }) => (
          <button type="button" onClick={save}>
            Save
          </button>
        )}
        deleteDialog={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalled();
  });

  it("confirms before navigating back when there are unsaved title edits", () => {
    /** Renders the shell with mutable title state for unsaved-change guards. */
    function Harness() {
      const [title, setTitle] = useState("Saved title");
      return (
        <E2eeRichTextItemEditorShell
          editorSessionKey="test-item"
          title={title}
          description={null}
          isLoading={false}
          hasItem
          error={null}
          hasInitialized
          onTitleChange={setTitle}
          onSave={onSave}
          onRefresh={onRefresh}
          onBack={onBack}
          titlePlaceholder="Title"
          notFoundMessage="Not found"
          loadErrorMessage="Load failed"
          renderCommandBar={({ onBack: back }) => (
            <button type="button" onClick={back}>
              Back
            </button>
          )}
          deleteDialog={null}
        />
      );
    }

    render(<Harness />);

    const titleInput = screen.getByPlaceholderText("Title");
    fireEvent.change(titleInput, { target: { value: "Dirty title" } });
    fireEvent.change(titleInput, { target: { value: "Dirty title!" } });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onBack).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alertdialog", { name: "Unsaved changes" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));

    expect(onBack).toHaveBeenCalled();
  });

  it("confirms before navigating back when the rich-text body is edited", () => {
    render(
      <E2eeRichTextItemEditorShell
        editorSessionKey="test-item"
        title="Saved title"
        description={null}
        isLoading={false}
        hasItem
        error={null}
        hasInitialized
        onTitleChange={vi.fn()}
        onSave={onSave}
        onRefresh={onRefresh}
        onBack={onBack}
        titlePlaceholder="Title"
        notFoundMessage="Not found"
        loadErrorMessage="Load failed"
        renderCommandBar={({ onBack: back }) => (
          <button type="button" onClick={back}>
            Back
          </button>
        )}
        deleteDialog={null}
      />
    );

    const editBody = screen.getByTestId("mock-tiptap-edit");
    fireEvent.click(editBody);
    fireEvent.click(editBody);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onBack).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alertdialog", { name: "Unsaved changes" })
    ).toBeInTheDocument();
  });

  it("confirms before navigating back when hasAdditionalUnsavedChanges is true", () => {
    render(
      <E2eeRichTextItemEditorShell
        editorSessionKey="test-item"
        title="Saved title"
        description={null}
        isLoading={false}
        hasItem
        error={null}
        hasInitialized
        hasAdditionalUnsavedChanges
        onTitleChange={vi.fn()}
        onSave={onSave}
        onRefresh={onRefresh}
        onBack={onBack}
        titlePlaceholder="Title"
        notFoundMessage="Not found"
        loadErrorMessage="Load failed"
        renderCommandBar={({ onBack: back }) => (
          <button type="button" onClick={back}>
            Back
          </button>
        )}
        deleteDialog={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onBack).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alertdialog", { name: "Unsaved changes" })
    ).toBeInTheDocument();
  });

  it("calls onRefresh from the command bar when there are no unsaved changes", () => {
    render(
      <E2eeRichTextItemEditorShell
        editorSessionKey="test-item"
        title="Saved title"
        description={null}
        isLoading={false}
        hasItem
        error={null}
        hasInitialized
        onTitleChange={vi.fn()}
        onSave={onSave}
        onRefresh={onRefresh}
        onBack={onBack}
        titlePlaceholder="Title"
        notFoundMessage="Not found"
        loadErrorMessage="Load failed"
        renderCommandBar={({ onRefresh: refresh }) => (
          <button type="button" onClick={refresh}>
            Refresh
          </button>
        )}
        deleteDialog={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(onRefresh).toHaveBeenCalled();
  });

  it("uses a flex-filling loading placeholder before initialization", () => {
    const { container } = render(
      <E2eeRichTextItemEditorShell
        editorSessionKey="test-item"
        title=""
        description={null}
        isLoading
        hasItem={false}
        error={null}
        hasInitialized={false}
        onTitleChange={vi.fn()}
        onSave={onSave}
        onRefresh={onRefresh}
        onBack={onBack}
        titlePlaceholder="Title"
        notFoundMessage="Not found"
        loadErrorMessage="Load failed"
        renderCommandBar={() => null}
        deleteDialog={null}
      />
    );

    const loadingHost = container.querySelector(".animate-spin")?.parentElement;
    expect(loadingHost?.className).toContain("flex-1");
    expect(loadingHost?.className).toContain("min-h-0");
  });
});

describe("useE2eeRichTextItemEditorSave", () => {
  it("serializes description JSON before calling update", async () => {
    const update = vi.fn(async () => true);
    const { result } = renderHook(() =>
      useE2eeRichTextItemEditorSave({ update })
    );

    await act(async () => {
      await result.current("Title", { type: "doc", content: [] });
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Title",
        description: expect.any(String),
      })
    );
  });
});
