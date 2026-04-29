"use client";

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ItemActionPanel } from "./item-action-panel";

import type { Item } from "@/lib/types";

vi.mock("@/components/ui/date-time-picker", () => ({
  DateTimePicker: ({
    value,
    placeholder,
  }: {
    value: string | null;
    placeholder: string;
  }) => (
    <div data-testid={`date-time-picker-${placeholder}`}>
      {value ?? "empty"}
    </div>
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

describe("ItemActionPanel overdue badge", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows overdue badge for end dates before hydrated current time", async () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW_MS);

    render(
      <ItemActionPanel
        item={buildItem({ end_date: "2026-04-20T12:00:00.000Z" })}
        stages={[]}
        isLoadingStages={false}
        onStageChange={() => {}}
        labels={[]}
        isLoadingLabels={false}
        onLabelChange={() => {}}
        onPriorityChange={() => {}}
        onStartDateChange={() => {}}
        onEndDateChange={() => {}}
      />
    );

    expect(await screen.findByText("Overdue")).toBeInTheDocument();
  });

  it("does not show overdue badge for future end dates", () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW_MS);

    render(
      <ItemActionPanel
        item={buildItem({ end_date: "2026-05-20T12:00:00.000Z" })}
        stages={[]}
        isLoadingStages={false}
        onStageChange={() => {}}
        labels={[]}
        isLoadingLabels={false}
        onLabelChange={() => {}}
        onPriorityChange={() => {}}
        onStartDateChange={() => {}}
        onEndDateChange={() => {}}
      />
    );

    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });
});
