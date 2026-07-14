import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DatePicker } from "./date-picker";
import { DateTimePicker } from "./date-time-picker";

describe("DatePicker", () => {
  it("forwards id onto the trigger button", () => {
    render(
      <DatePicker
        value={null}
        onChange={() => undefined}
        id="birthday"
        placeholder="Pick a date"
      />
    );

    expect(
      screen.getByRole("button", { name: /Pick a date/i })
    ).toHaveAttribute("id", "birthday");
  });
});

describe("DateTimePicker", () => {
  it("forwards id onto the trigger button", () => {
    render(
      <DateTimePicker
        value={null}
        onChange={() => undefined}
        id="start-date"
        placeholder="Pick date & time"
      />
    );

    expect(
      screen.getByRole("button", { name: /Pick date & time/i })
    ).toHaveAttribute("id", "start-date");
  });

  it("keeps id on the trigger when a datetime value is set", () => {
    render(
      <DateTimePicker
        value="2026-04-20T12:30:00.000Z"
        onChange={() => undefined}
        id="end-date"
        placeholder="Pick date & time"
      />
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("id", "end-date");
    expect(trigger).not.toHaveTextContent("Pick date & time");
  });
});
