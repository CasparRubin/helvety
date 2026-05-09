import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DEFAULT_NOTE_CATEGORIES } from "@/lib/config/default-note-categories";

import { EntityList } from "./entity-list";

import type { Item } from "@/lib/types";

const baseNote = (overrides: Partial<Item>): Item => ({
  id: "n1",
  user_id: "user-1",
  title: "Meeting notes",
  description: null,
  category_id: "personal",
  sort_order: 0,
  created_at: "2026-01-01T12:00:00.000Z",
  updated_at: "2026-01-01T12:00:00.000Z",
  ...overrides,
});

describe("EntityList", () => {
  it("keeps visible rows rendered while a background refresh is active", () => {
    render(
      <EntityList
        entities={[baseNote({ id: "visible" })]}
        isLoading={false}
        isRefreshing
        error={null}
        categories={DEFAULT_NOTE_CATEGORIES}
      />
    );

    expect(screen.getByText("Meeting notes")).toBeInTheDocument();
  });

  it("shows category section headers with zero counts when there are no notes", () => {
    render(
      <EntityList
        entities={[]}
        isLoading={false}
        error={null}
        categories={DEFAULT_NOTE_CATEGORIES}
      />
    );

    expect(
      screen.getByRole("button", { name: /Personal\(0\)/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Work\(0\)/ })
    ).toBeInTheDocument();
  });

  it("does not show the global empty message when categories exist but the list is empty", () => {
    render(
      <EntityList
        entities={[]}
        isLoading={false}
        error={null}
        categories={DEFAULT_NOTE_CATEGORIES}
      />
    );

    expect(screen.queryByText("No notes yet")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Create your first note to get started.")
    ).not.toBeInTheDocument();
  });

  it("shows the global empty message only when there are no categories and no notes", () => {
    render(
      <EntityList
        entities={[]}
        isLoading={false}
        error={null}
        categories={[]}
      />
    );

    expect(screen.getByText("No notes yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create your first note to get started.")
    ).toBeInTheDocument();
  });

  it("shows emptySearchMessage instead of category shells when filtered list is empty", () => {
    render(
      <EntityList
        entities={[]}
        isLoading={false}
        error={null}
        categories={DEFAULT_NOTE_CATEGORIES}
        emptySearchMessage="No notes match your search."
      />
    );

    expect(screen.getByText("No notes match your search.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Personal\(0\)/ })
    ).not.toBeInTheDocument();
  });

  it("renders notes in a flat list when no categories are configured", () => {
    const notes = [
      baseNote({
        id: "a",
        title: "Ideas",
        sort_order: 0,
      }),
    ];

    render(
      <EntityList
        entities={notes}
        isLoading={false}
        error={null}
        categories={[]}
      />
    );

    expect(screen.getByText("Ideas")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Personal\(0\)/ })
    ).not.toBeInTheDocument();
  });
});
