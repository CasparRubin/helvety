import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NoteCommandBar } from "./note-command-bar";

describe("NoteCommandBar", () => {
  it("keeps primary actions accessible with compact icon-first labels", () => {
    render(<NoteCommandBar onCreateClick={vi.fn()} createLabel="New Note" />);

    expect(
      screen.getByRole("button", { name: "New Note" })
    ).toBeInTheDocument();
  });

  it("styles the desktop refresh button in amber while refreshing", () => {
    render(
      <NoteCommandBar
        onCreateClick={vi.fn()}
        createLabel="New Note"
        onRefresh={vi.fn()}
        isRefreshing
      />
    );

    const refreshButton = screen.getByRole("button", { name: "Refresh" });
    expect(refreshButton).toBeDisabled();
    expect(refreshButton).toHaveClass("bg-amber-500");
  });

  it("shows overflow and secondary actions for export/settings", () => {
    render(
      <NoteCommandBar
        onCreateClick={vi.fn()}
        createLabel="New Note"
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
