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

  it("styles the desktop refresh button in amber while refreshing", () => {
    render(
      <ContactCommandBar
        onCreateClick={vi.fn()}
        onRefresh={vi.fn()}
        isRefreshing
      />
    );

    const refreshButton = screen.getByRole("button", { name: "Refresh" });
    expect(refreshButton).toBeDisabled();
    expect(refreshButton).toHaveClass("bg-amber-500");
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
