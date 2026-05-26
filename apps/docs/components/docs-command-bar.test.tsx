import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocsCommandBar } from "./docs-command-bar";

const baseProps = {
  isSaving: false,
  canSaveToVault: false,
  vaultDocId: null as string | null,
  showMyDocuments: false,
  onNewDocument: vi.fn(),
  onOpenFile: vi.fn(),
  onDownload: vi.fn(),
  onSaveToVault: vi.fn(),
  onOpenMyDocuments: vi.fn(),
};

describe("DocsCommandBar", () => {
  it("exposes core document and vault actions", () => {
    render(<DocsCommandBar {...baseProps} />);

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

  it("calls document action handlers from primary buttons", () => {
    const onNewDocument = vi.fn();
    const onOpenFile = vi.fn();
    const onDownload = vi.fn();

    render(
      <DocsCommandBar
        {...baseProps}
        onNewDocument={onNewDocument}
        onOpenFile={onOpenFile}
        onDownload={onDownload}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "New document" }));
    fireEvent.click(screen.getByRole("button", { name: "Open document" }));
    fireEvent.click(screen.getByRole("button", { name: "Download document" }));

    expect(onNewDocument).toHaveBeenCalledTimes(1);
    expect(onOpenFile).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("shows My documents on desktop when signed in", () => {
    render(
      <DocsCommandBar
        {...baseProps}
        canSaveToVault={true}
        showMyDocuments={true}
      />
    );

    expect(screen.getByRole("button", { name: "My documents" })).toHaveClass(
      "hidden",
      "md:inline-flex"
    );
    expect(
      screen.getByRole("button", { name: "More document actions" })
    ).toBeInTheDocument();
  });

  it("enables Save to vault and shows update label when editing a vault doc", () => {
    render(
      <DocsCommandBar
        {...baseProps}
        canSaveToVault={true}
        vaultDocId="doc-1"
        showMyDocuments={true}
      />
    );

    expect(
      screen.getByRole("button", { name: "Update vault document" })
    ).toBeEnabled();
  });

  it("calls onSaveToVault from the desktop button when vault is unlocked", () => {
    const onSaveToVault = vi.fn();

    render(
      <DocsCommandBar
        {...baseProps}
        canSaveToVault={true}
        showMyDocuments={true}
        onSaveToVault={onSaveToVault}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Save to vault" }));
    expect(onSaveToVault).toHaveBeenCalledTimes(1);
  });
});
