import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocsTitleBarActions } from "./docs-title-bar-actions";

describe("DocsTitleBarActions", () => {
  it("exposes core document and vault actions", () => {
    render(
      <DocsTitleBarActions
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

  it("calls onDownload when Download is clicked", () => {
    const onDownload = vi.fn();

    render(
      <DocsTitleBarActions
        isSaving={false}
        canSaveToVault={false}
        vaultDocId={null}
        showMyDocuments={false}
        onNewDocument={vi.fn()}
        onOpenFile={vi.fn()}
        onDownload={onDownload}
        onSaveToVault={vi.fn()}
        onOpenMyDocuments={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Download document" }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("marks Save to vault with the vault accent class", () => {
    const { container } = render(
      <DocsTitleBarActions
        isSaving={false}
        canSaveToVault={true}
        vaultDocId={null}
        showMyDocuments={false}
        onNewDocument={vi.fn()}
        onOpenFile={vi.fn()}
        onDownload={vi.fn()}
        onSaveToVault={vi.fn()}
        onOpenMyDocuments={vi.fn()}
      />
    );

    expect(
      container.querySelector(".docs-title-bar-action--vault")
    ).toBeInTheDocument();
  });

  it("shows My documents when signed in", () => {
    render(
      <DocsTitleBarActions
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
