import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContactEditorCommandBar } from "./contact-editor-command-bar";

describe("ContactEditorCommandBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the back button by default", () => {
    render(
      <ContactEditorCommandBar
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
      <ContactEditorCommandBar
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
});
