import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactCommandBar } from "./contact-command-bar";

describe("ContactCommandBar", () => {
  it("keeps the create action accessible with compact icon-first labels", () => {
    render(<ContactCommandBar onCreateClick={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "New Contact" })
    ).toBeInTheDocument();
  });

  it("disables refresh and shows a spinner while refreshing", () => {
    render(
      <ContactCommandBar
        onCreateClick={vi.fn()}
        onRefresh={vi.fn()}
        isRefreshing
      />
    );

    const refreshButtons = screen.getAllByRole("button", { name: "Refresh" });
    expect(refreshButtons.length).toBeGreaterThanOrEqual(1);
    for (const refreshButton of refreshButtons) {
      expect(refreshButton).toBeDisabled();
      expect(refreshButton.querySelector("svg")).toHaveClass("animate-spin");
    }
  });

  it("shows secondary action labels when export/settings are enabled", () => {
    render(
      <ContactCommandBar
        onCreateClick={vi.fn()}
        onExport={vi.fn()}
        onSettings={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Export Data" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Settings" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "More actions" })
    ).toBeInTheDocument();
  });
});
