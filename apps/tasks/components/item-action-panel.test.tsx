"use client";

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ItemActionPanel } from "./item-action-panel";

import type { Item } from "@/lib/types";

vi.mock("@helvety/ui/date-time-picker", () => ({
  DateTimePicker: ({
    value,
    placeholder,
    id,
  }: {
    value: string | null;
    placeholder: string;
    id?: string;
  }) => (
    <button
      type="button"
      id={id}
      data-testid={`date-time-picker-${placeholder}`}
    >
      {value ?? "empty"}
    </button>
  ),
}));

vi.mock("@helvety/ui/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

const NOW_MS = Date.parse("2026-04-29T09:00:00.000Z");

/** Build a valid Item fixture with per-test overrides. */
function buildItem(overrides: Partial<Item> = {}): Item {
  return {
    id: "item-1",
    user_id: "user-1",
    title: "Task",
    description: null,
    start_date: null,
    end_date: null,
    stage_id: "stage-1",
    label_id: null,
    priority: 1,
    sort_order: 0,
    created_at: "2026-04-01T08:00:00.000Z",
    updated_at: "2026-04-01T08:00:00.000Z",
    ...overrides,
  };
}

/** Shared props for ItemActionPanel date-field tests. */
function panelProps(item: Item) {
  return {
    item,
    stages: [],
    isLoadingStages: false,
    onStageChange: () => {},
    labels: [],
    isLoadingLabels: false,
    onLabelChange: () => {},
    onPriorityChange: () => {},
    onStartDateChange: () => {},
    onEndDateChange: () => {},
  };
}

describe("ItemActionPanel date fields", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("associates Start and End labels with FormField ids", () => {
    render(<ItemActionPanel {...panelProps(buildItem())} />);

    expect(screen.getByLabelText("Start")).toHaveAttribute("id", "start-date");
    expect(screen.getByLabelText("End")).toHaveAttribute("id", "end-date");
  });

  it("shows overdue badge for end dates before hydrated current time", async () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW_MS);

    render(
      <ItemActionPanel
        {...panelProps(buildItem({ end_date: "2026-04-20T12:00:00.000Z" }))}
      />
    );

    expect(await screen.findByText("Overdue")).toBeInTheDocument();
    expect(screen.getByLabelText("End")).toBeInTheDocument();
  });

  it("does not show overdue badge for future end dates", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW_MS);

    render(
      <ItemActionPanel
        {...panelProps(buildItem({ end_date: "2026-05-20T12:00:00.000Z" }))}
      />
    );

    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });
});
