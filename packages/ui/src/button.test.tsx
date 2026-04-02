import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button type="button">Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("forwards click to handler", () => {
    const onClick = vi.fn();
    render(
      <Button type="button" onClick={onClick}>
        Go
      </Button>
    );
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
