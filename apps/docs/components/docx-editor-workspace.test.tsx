import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const docxEditorMock = vi.fn((_props: Record<string, unknown>) => null);

vi.mock("@eigenpal/docx-editor-react", () => ({
  createEmptyDocument: vi.fn(() => ({ type: "blank-document" })),
  DocxEditor: (props: Record<string, unknown>) => {
    docxEditorMock(props);
    return null;
  },
}));

import { DocxEditorWorkspace } from "./docx-editor-workspace";

describe("DocxEditorWorkspace", () => {
  it("passes createEmptyDocument output when no buffer is loaded", () => {
    render(<DocxEditorWorkspace documentBuffer={null} sessionKey={1} />);

    expect(docxEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        document: { type: "blank-document" },
        comments: [],
        onCommentsChange: expect.any(Function),
      })
    );
    expect(docxEditorMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        documentBuffer: expect.anything(),
      })
    );
  });
});
