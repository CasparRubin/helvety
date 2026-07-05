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

  it("renders anchor href when render is an anchor with nativeButton={false}", () => {
    render(
      <Button render={<a href="/home" />} nativeButton={false}>
        Home
      </Button>
    );
    const home = screen.getByRole("button", { name: "Home" });
    expect(home).toHaveAttribute("href", "/home");
  });
});
