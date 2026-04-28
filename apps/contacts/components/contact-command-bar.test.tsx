import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactCommandBar } from "./contact-command-bar";

describe("ContactCommandBar", () => {
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
});
