import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getRangeInputByLabel, openMenuTrigger } from "./base-ui-test-helpers";

describe("openMenuTrigger", () => {
  it("fires pointerdown then click on the element", () => {
    const onPointerDown = vi.fn();
    const onClick = vi.fn();
    render(
      <button type="button" onPointerDown={onPointerDown} onClick={onClick}>
        Open
      </button>
    );
    openMenuTrigger(screen.getByRole("button", { name: "Open" }));
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("getRangeInputByLabel", () => {
  it("targets the range input inside a labeled group", () => {
    render(
      <div role="group" aria-label="Stroke">
        <input type="range" aria-label="Stroke" defaultValue="5" />
      </div>
    );
    expect(getRangeInputByLabel(screen, "Stroke")).toHaveAttribute(
      "type",
      "range"
    );
  });
});

describe("link-styled Base UI buttons", () => {
  it("keep role=button on anchor renders (document in tests via toHaveAttribute)", () => {
    render(
      <a href="/account" role="button">
        Account
      </a>
    );
    const account = screen.getByRole("button", { name: "Account" });
    expect(account).toHaveAttribute("href", "/account");
    expect(account).toHaveAttribute("role", "button");
  });
});
