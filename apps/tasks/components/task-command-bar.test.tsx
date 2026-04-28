import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskCommandBar } from "./task-command-bar";

describe("TaskCommandBar", () => {
  it("keeps primary actions accessible with compact icon-first labels", () => {
    render(<TaskCommandBar onCreateClick={vi.fn()} createLabel="New Task" />);

    expect(
      screen.getByRole("button", { name: "New Task" })
    ).toBeInTheDocument();
  });

  it("styles the desktop refresh button in amber while refreshing", () => {
    render(
      <TaskCommandBar
        onCreateClick={vi.fn()}
        createLabel="New Task"
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
      <TaskCommandBar
        onCreateClick={vi.fn()}
        createLabel="New Task"
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
