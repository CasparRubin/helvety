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
});
