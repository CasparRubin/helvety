import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LinksCommandBar } from "./links-command-bar";

describe("LinksCommandBar", () => {
  it("exposes primary create, refresh, and folder actions via accessible names", () => {
    render(
      <LinksCommandBar
        onCreateClick={vi.fn()}
        createLabel="New link"
        onCreateFolderClick={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "New link" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New folder" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Refresh" }).length
    ).toBeGreaterThan(0);
  });
});
