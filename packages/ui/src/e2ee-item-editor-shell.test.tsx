import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  E2eeRichTextItemEditorShell,
  useE2eeRichTextItemEditorSave,
} from "./e2ee-item-editor-shell";

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

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
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onBack).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alertdialog", { name: "Unsaved changes" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));

    expect(onBack).toHaveBeenCalled();
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
