import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocsCommandBar } from "./docs-command-bar";

describe("DocsCommandBar", () => {
  it("keeps download enabled on a blank editor and exposes core document actions", () => {
    render(
      <DocsCommandBar
        hasDocument={true}
        isSaving={false}
        canSaveToVault={false}
        vaultDocId={null}
        onNewDocument={vi.fn()}
        onOpenFile={vi.fn()}
        onDownload={vi.fn()}
        onSaveToVault={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "New document" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Open document" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Download document" })
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Save to vault" })
    ).toBeDisabled();
  });
});
