import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_STAGE_CONFIGS,
  getDefaultStages,
} from "@/lib/config/default-stages";

import { EntityList } from "./entity-list";

import type { Item, Stage } from "@/lib/types";

/** Full `Stage` fixtures from the built-in item stage catalog for EntityList tests. */
function testStages(): Stage[] {
  const configId = DEFAULT_STAGE_CONFIGS.item.id;
  const defaults = getDefaultStages(configId);
  if (!defaults) return [];
  return defaults.map((ds) => ({
    id: ds.id,
    config_id: configId,
    user_id: "test",
    name: ds.name,
    color: ds.color,
    icon: ds.icon,
    sort_order: ds.sort_order,
    default_rows_shown: ds.default_rows_shown,
    created_at: "2026-01-01T12:00:00.000Z",
  }));
}

const baseTask = (overrides: Partial<Item>): Item => ({
  id: "t1",
  user_id: "user-1",
  title: "Ship feature",
  description: null,
  start_date: null,
  end_date: null,
  stage_id: "default-item-backlog",
  label_id: null,
  priority: 1,
  sort_order: 0,
  created_at: "2026-01-01T12:00:00.000Z",
  updated_at: "2026-01-01T12:00:00.000Z",
  ...overrides,
});

describe("EntityList", () => {
  it("keeps visible rows rendered while a background refresh is active", () => {
    render(
      <EntityList
        entities={[baseTask({ id: "visible" })]}
        isLoading={false}
        isRefreshing
        error={null}
        stages={testStages()}
      />
    );

    expect(screen.getByText("Ship feature")).toBeInTheDocument();
  });

  it("shows stage section headers with zero counts when there are no tasks", () => {
    render(
      <EntityList
        entities={[]}
        isLoading={false}
        error={null}
        stages={testStages()}
      />
    );

    expect(
      screen.getByRole("button", { name: /Backlog\(0\)/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Discovery\(0\)/ })
    ).toBeInTheDocument();
  });

  it("does not show the global empty message when stages exist but the list is empty", () => {
    render(
      <EntityList
        entities={[]}
        isLoading={false}
        error={null}
        stages={testStages()}
      />
    );

    expect(screen.queryByText("No tasks yet")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Create your first task to get started.")
    ).not.toBeInTheDocument();
  });

  it("shows the global empty message only when there are no stages and no tasks", () => {
    render(
      <EntityList entities={[]} isLoading={false} error={null} stages={[]} />
    );

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create your first task to get started.")
    ).toBeInTheDocument();
  });

  it("shows emptySearchMessage instead of stage shells when filtered list is empty", () => {
    render(
      <EntityList
        entities={[]}
        isLoading={false}
        error={null}
        stages={testStages()}
        emptySearchMessage="No tasks match your search."
      />
    );

    expect(screen.getByText("No tasks match your search.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Backlog\(0\)/ })
    ).not.toBeInTheDocument();
  });

  it("renders tasks in a flat list when no stages are configured", () => {
    const tasks = [
      baseTask({
        id: "a",
        title: "Refactor auth",
        sort_order: 0,
      }),
    ];

    render(
      <EntityList entities={tasks} isLoading={false} error={null} stages={[]} />
    );

    expect(screen.getByText("Refactor auth")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Backlog\(0\)/ })
    ).not.toBeInTheDocument();
  });
});
