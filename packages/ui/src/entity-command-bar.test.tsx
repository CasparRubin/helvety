import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EntityCommandBar } from "./entity-command-bar";

describe("EntityCommandBar", () => {
  it("disables all refresh controls and shows spinners while refreshing", () => {
    render(
      <EntityCommandBar
        createLabel="New Item"
        onCreateClick={vi.fn()}
        onRefresh={vi.fn()}
        isRefreshing
      />
    );

    const refreshButtons = screen.getAllByRole("button", { name: "Refresh" });
    expect(refreshButtons).toHaveLength(2);
    for (const button of refreshButtons) {
      expect(button).toBeDisabled();
      expect(button.querySelector("svg")).toHaveClass("animate-spin");
    }
  });
});
