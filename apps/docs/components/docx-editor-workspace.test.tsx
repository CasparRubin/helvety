import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const docxEditorMock = vi.fn((_props: Record<string, unknown>) => null);

vi.mock("@eigenpal/docx-editor-react", () => ({
  createEmptyDocument: vi.fn(() => ({ type: "blank-document" })),
  DocxEditor: (props: Record<string, unknown>) => {
    docxEditorMock(props);
    return null;
  },
}));

vi.mock("@/hooks/use-hide-vendor-file-menu-items", () => ({
  useHideVendorFileMenuItems: vi.fn(),
}));

import { DocxEditorWorkspace } from "./docx-editor-workspace";

const chromeProps = {
  documentName: "Untitled",
  onDocumentNameChange: vi.fn(),
  onDownload: vi.fn(),
};

describe("DocxEditorWorkspace", () => {
  beforeEach(() => {
    docxEditorMock.mockClear();
    chromeProps.onDownload.mockClear();
  });

  it("passes createEmptyDocument output when no buffer is loaded", () => {
    render(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={1}
        {...chromeProps}
      />
    );

    expect(docxEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        document: { type: "blank-document" },
        documentName: "Untitled",
        onDocumentNameChange: chromeProps.onDocumentNameChange,
        showToolbar: true,
        mode: "editing",
        showRuler: true,
        showZoomControl: true,
      })
    );
    expect(docxEditorMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        documentBuffer: expect.anything(),
      })
    );
  });

  it("passes documentBuffer when a file is loaded", () => {
    const buffer = new ArrayBuffer(16);

    render(
      <DocxEditorWorkspace
        documentBuffer={buffer}
        sessionKey={1}
        {...chromeProps}
      />
    );

    expect(docxEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentBuffer: buffer,
      })
    );
    expect(docxEditorMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        document: expect.anything(),
      })
    );
  });

  it("does not pass controlled comments props to Eigenpal", () => {
    render(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={1}
        {...chromeProps}
      />
    );

    expect(docxEditorMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        comments: expect.anything(),
        onCommentsChange: expect.anything(),
      })
    );
  });

  it("passes onDownload directly as onSave without a wrapper", () => {
    render(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={1}
        {...chromeProps}
      />
    );

    const lastCall = docxEditorMock.mock.calls.at(-1)?.[0] as {
      onSave?: (buffer: ArrayBuffer) => void;
    };
    expect(lastCall.onSave).toBe(chromeProps.onDownload);

    const buffer = new ArrayBuffer(8);
    lastCall.onSave?.(buffer);
    expect(chromeProps.onDownload).toHaveBeenCalledWith(buffer);
  });

  it("remounts the editor when sessionKey changes", () => {
    const { rerender } = render(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={1}
        {...chromeProps}
      />
    );

    expect(docxEditorMock).toHaveBeenCalledTimes(1);

    rerender(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={2}
        {...chromeProps}
      />
    );

    expect(docxEditorMock).toHaveBeenCalledTimes(2);
  });

  it("does not inject Helvety actions into the Eigenpal title bar", () => {
    render(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={1}
        {...chromeProps}
      />
    );

    const lastCall = docxEditorMock.mock.calls.at(-1)?.[0] as Record<
      string,
      unknown
    >;
    expect(lastCall.renderTitleBarRight).toBeUndefined();
  });
});
