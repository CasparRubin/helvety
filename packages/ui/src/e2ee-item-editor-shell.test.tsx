"use client";

import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import * as React from "react";
import { useCallback, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  E2eeRichTextItemEditorShell,
  useE2eeRichTextItemEditorSave,
} from "./e2ee-item-editor-shell";

import type { JSONContent } from "@tiptap/react";

const {
  EMPTY_DOC,
  EDITED_DOC,
  EDITED_AGAIN_DOC,
  setContentSpy,
  lastTiptapContentProp,
  mockBehavior,
} = vi.hoisted(() => ({
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
  setContentSpy: vi.fn(),
  lastTiptapContentProp: { current: null as JSONContent | null | undefined },
  // Per-test toggle: simulate TipTap v3 setEditable emitting a spurious update
  // with the still-empty document before the shell loads content imperatively.
  mockBehavior: { emitEmptyOnMount: false },
}));

/** Imperative handle stub for mocked `TiptapEditor` in shell tests. */
type MockTiptapEditorHandle = {
  getJSON: () => JSONContent;
  setContent: (content: JSONContent | string | null) => void;
  focus: () => void;
  getEditor: () => null;
};

vi.mock("./tiptap-editor", () => {
  const MockTiptapEditor = React.forwardRef<
    MockTiptapEditorHandle,
    { content?: JSONContent | null; onChange?: (content: JSONContent) => void }
  >(({ content = null, onChange }, ref) => {
    lastTiptapContentProp.current = content;
    // Use refs so getJSON is synchronous (matches real TipTap), letting the
    // shell capture the post-load baseline deterministically.
    const contentRef = React.useRef<JSONContent>(EMPTY_DOC);
    const editCountRef = React.useRef(0);
    const onChangeRef = React.useRef(onChange);
    onChangeRef.current = onChange;

    React.useEffect(() => {
      if (mockBehavior.emitEmptyOnMount) {
        onChangeRef.current?.(contentRef.current);
      }
    }, []);

    React.useImperativeHandle(ref, () => ({
      getJSON: () => contentRef.current,
      setContent: (nextContent) => {
        setContentSpy(nextContent);
        const resolved =
          nextContent === null
            ? EMPTY_DOC
            : typeof nextContent === "object"
              ? nextContent
              : contentRef.current;
        const changed = resolved !== contentRef.current;
        contentRef.current = resolved;
        // Real TipTap only emits an update when the document actually changes.
        if (changed) {
          onChangeRef.current?.(resolved);
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
          const next =
            editCountRef.current === 0 ? EDITED_DOC : EDITED_AGAIN_DOC;
          editCountRef.current += 1;
          contentRef.current = next;
          onChangeRef.current?.(next);
        },
      },
      "Edit body"
    );
  });
  MockTiptapEditor.displayName = "MockTiptapEditor";

  return {
    TiptapEditor: MockTiptapEditor,
  };
});

describe("E2eeRichTextItemEditorShell", () => {
  const onSave = vi.fn(async () => true);
  const onRefresh = vi.fn(async () => undefined);
  const onBack = vi.fn();

  const baseShellProps = {
    title: "Hello",
    initialDescription: null as string | null,
    isLoading: false,
    hasItem: true,
    error: null as string | null,
    hasInitialized: true,
    onTitleChange: vi.fn(),
    onSave,
    onRefresh,
    onBack,
    titlePlaceholder: "Title",
    notFoundMessage: "Not found",
    loadErrorMessage: "Load failed",
    renderCommandBar: ({ onSave: save }: { onSave: () => void }) => (
      <button type="button" onClick={save}>
        Save
      </button>
    ),
    deleteDialog: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setContentSpy.mockClear();
    lastTiptapContentProp.current = null;
    mockBehavior.emitEmptyOnMount = false;
  });

  it("calls onSave when the command bar save action runs", () => {
    render(
      <E2eeRichTextItemEditorShell
        editorSessionKey="test-item"
        title="Hello"
        initialDescription={null}
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
          initialDescription={null}
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

  it("does not show unsaved changes when opening with existing content despite a spurious pre-load update", () => {
    // Reproduces the original bug: TipTap's setEditable emitted an empty-doc
    // update before the real content loaded, which was captured as the baseline
    // and made the editor look dirty on open.
    mockBehavior.emitEmptyOnMount = true;

    render(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="existing-content-session"
        title="Saved title"
        initialDescription='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"existing body"}]}]}'
        renderCommandBar={({ onBack: back }) => (
          <button type="button" onClick={back}>
            Back
          </button>
        )}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    // No edits were made, so navigating back must not be guarded.
    expect(onBack).toHaveBeenCalled();
    expect(
      screen.queryByRole("alertdialog", { name: "Unsaved changes" })
    ).not.toBeInTheDocument();
  });

  it("arms the unsaved-changes guard on the first body edit when initialDescription is empty", () => {
    render(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="empty-session"
        title="Saved title"
        initialDescription={null}
        renderCommandBar={({ onBack: back }) => (
          <button type="button" onClick={back}>
            Back
          </button>
        )}
      />
    );

    // A single edit on a previously-empty body must mark the editor dirty,
    // otherwise the first paragraph could be lost on navigation away.
    fireEvent.click(screen.getByTestId("mock-tiptap-edit"));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onBack).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alertdialog", { name: "Unsaved changes" })
    ).toBeInTheDocument();
  });

  it("confirms before navigating back when the rich-text body is edited", () => {
    render(
      <E2eeRichTextItemEditorShell
        editorSessionKey="test-item"
        title="Saved title"
        initialDescription={null}
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
        initialDescription={null}
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
        initialDescription={null}
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

  it("shows load error when the item is missing and an error is set", () => {
    render(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="test-item"
        hasItem={false}
        error="List failed"
        hasInitialized={false}
        renderCommandBar={() => null}
      />
    );

    expect(screen.getByText("Load failed")).toBeInTheDocument();
  });

  it("shows not-found when the item is missing without an error", () => {
    render(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="test-item"
        hasItem={false}
        error={null}
        hasInitialized={false}
        renderCommandBar={() => null}
      />
    );

    expect(screen.getByText("Not found")).toBeInTheDocument();
  });

  it("renders the editor when hasItem is true even if a list error is set", () => {
    render(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="test-item"
        hasItem
        error="Failed to refresh list"
        title="Loaded title"
        renderCommandBar={() => null}
      />
    );

    expect(
      screen.queryByText("Failed to refresh list")
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Loaded title")).toBeInTheDocument();
  });

  it("uses a flex-filling loading placeholder before initialization", () => {
    const { container } = render(
      <E2eeRichTextItemEditorShell
        editorSessionKey="test-item"
        title=""
        initialDescription={null}
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

  it("mounts TipTap with null content and loads initialDescription imperatively", async () => {
    render(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="session-1"
        initialDescription='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"seed"}]}]}'
      />
    );

    expect(lastTiptapContentProp.current).toBeNull();
    await waitFor(() => expect(setContentSpy).toHaveBeenCalledTimes(1));
  });

  it("does not reload description when initialDescription prop changes within the same session", async () => {
    const { rerender } = render(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="session-1"
        initialDescription='{"type":"doc","content":[]}'
      />
    );

    await waitFor(() => expect(setContentSpy).toHaveBeenCalledTimes(1));

    rerender(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="session-1"
        initialDescription='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"server-updated"}]}]}'
      />
    );

    expect(setContentSpy).toHaveBeenCalledTimes(1);
  });

  it("loads description again when editorSessionKey changes", async () => {
    const { rerender } = render(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="session-a"
        initialDescription='{"type":"doc","content":[]}'
      />
    );

    await waitFor(() => expect(setContentSpy).toHaveBeenCalledTimes(1));

    rerender(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="session-b"
        initialDescription='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"other item"}]}]}'
      />
    );

    await waitFor(() => expect(setContentSpy).toHaveBeenCalledTimes(2));
  });

  it("reloads description after refresh resets initialization", async () => {
    /** Simulates zone editors toggling hasInitialized around list refresh. */
    function RefreshHarness() {
      const [hasInitialized, setHasInitialized] = useState(true);
      const [initialDescription, setInitialDescription] = useState<
        string | null
      >('{"type":"doc","content":[]}');
      const handleRefresh = useCallback(async () => {
        setHasInitialized(false);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
        setInitialDescription(
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"fresh from server"}]}]}'
        );
        setHasInitialized(true);
      }, []);

      return (
        <E2eeRichTextItemEditorShell
          {...baseShellProps}
          editorSessionKey="session-1"
          initialDescription={initialDescription}
          hasInitialized={hasInitialized}
          onRefresh={handleRefresh}
          renderCommandBar={({ onRefresh: refresh }) => (
            <button type="button" onClick={() => void refresh()}>
              Refresh
            </button>
          )}
        />
      );
    }

    render(<RefreshHarness />);

    await waitFor(() => expect(setContentSpy).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    });

    await waitFor(() => expect(setContentSpy).toHaveBeenCalledTimes(2));
  });

  it("confirms before refresh when there are unsaved rich-text edits", () => {
    render(
      <E2eeRichTextItemEditorShell
        {...baseShellProps}
        editorSessionKey="session-1"
        title="Saved title"
        renderCommandBar={({ onRefresh: refresh }) => (
          <button type="button" onClick={refresh}>
            Refresh
          </button>
        )}
      />
    );

    fireEvent.click(screen.getByTestId("mock-tiptap-edit"));
    fireEvent.click(screen.getByTestId("mock-tiptap-edit"));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(onRefresh).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alertdialog", { name: "Unsaved changes" })
    ).toBeInTheDocument();
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
