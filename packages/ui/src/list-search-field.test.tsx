import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ListSearchField } from "./list-search-field";

describe("ListSearchField", () => {
  it("renders a search landmark and labelled searchbox", () => {
    const onChange = vi.fn();
    render(
      <ListSearchField value="" onChange={onChange} aria-label="Search tasks" />
    );

    const searchRegion = screen.getByRole("search");
    expect(searchRegion).toBeInTheDocument();
    expect(
      within(searchRegion).getByRole("searchbox", { name: "Search tasks" })
    ).toBeInTheDocument();
  });

  it("shows clear control when non-empty and clears via onChange", () => {
    const onChange = vi.fn();
    render(
      <ListSearchField value="hello" onChange={onChange} aria-label="Search" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const event = onChange.mock.calls[0]![0] as { target: { value: string } };
    expect(event.target.value).toBe("");
  });
});
