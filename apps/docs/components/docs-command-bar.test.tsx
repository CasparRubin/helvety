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
        showMyDocuments={false}
        onNewDocument={vi.fn()}
        onOpenFile={vi.fn()}
        onDownload={vi.fn()}
        onSaveToVault={vi.fn()}
        onOpenMyDocuments={vi.fn()}
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
    expect(
      screen.queryByRole("button", { name: "My documents" })
    ).not.toBeInTheDocument();
  });

  it("shows My documents when signed in", () => {
    render(
      <DocsCommandBar
        hasDocument={true}
        isSaving={false}
        canSaveToVault={true}
        vaultDocId={null}
        showMyDocuments={true}
        onNewDocument={vi.fn()}
        onOpenFile={vi.fn()}
        onDownload={vi.fn()}
        onSaveToVault={vi.fn()}
        onOpenMyDocuments={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "My documents" })
    ).toBeInTheDocument();
  });
});
