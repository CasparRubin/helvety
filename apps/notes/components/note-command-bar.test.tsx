import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NoteCommandBar } from "./note-command-bar";

describe("NoteCommandBar", () => {
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
});
