import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskCommandBar } from "./task-command-bar";

describe("TaskCommandBar", () => {
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
});
