import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Calendar } from "./calendar";

describe("Calendar", () => {
  it("renders react-day-picker v10 month grid markup", () => {
    render(<Calendar mode="single" />);

    const calendar = document.querySelector('[data-slot="calendar"]');
    expect(calendar).toBeInTheDocument();

    const grid = screen.getByRole("grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass("border-collapse");
  });
});
