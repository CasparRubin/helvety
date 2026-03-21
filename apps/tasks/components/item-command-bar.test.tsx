import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ItemCommandBar } from "./item-command-bar";

describe("ItemCommandBar", () => {
  it("shows the back button by default", () => {
    render(
      <ItemCommandBar
        onBack={vi.fn()}
        onRefresh={vi.fn()}
        onSave={vi.fn()}
        hasUnsavedChanges
      />
    );

    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("hides the back button when showBack is false", () => {
    render(
      <ItemCommandBar
        onBack={vi.fn()}
        showBack={false}
        onRefresh={vi.fn()}
        onSave={vi.fn()}
        hasUnsavedChanges
      />
    );

    expect(
      screen.queryByRole("button", { name: "Back" })
    ).not.toBeInTheDocument();
  });

  it("shows a visible Save Changes label when there are unsaved changes (idle)", () => {
    render(
      <ItemCommandBar
        onBack={vi.fn()}
        onRefresh={vi.fn()}
        onSave={vi.fn()}
        hasUnsavedChanges
        saveStatus="idle"
        deleteLabel="Delete Task"
      />
    );

    expect(
      screen.getByRole("button", { name: /save changes/i })
    ).toBeInTheDocument();
  });

  it("uses an accessible Save label without visible Save text when there are no changes", () => {
    render(
      <ItemCommandBar
        onBack={vi.fn()}
        onRefresh={vi.fn()}
        onSave={vi.fn()}
        hasUnsavedChanges={false}
        deleteLabel="Delete Task"
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
  });

  it("exposes Refresh and delete via accessible names", () => {
    render(
      <ItemCommandBar
        onBack={vi.fn()}
        onRefresh={vi.fn()}
        onSave={vi.fn()}
        hasUnsavedChanges={false}
        onDelete={vi.fn()}
        deleteLabel="Delete Task"
      />
    );

    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Task" })
    ).toBeInTheDocument();
  });
});
