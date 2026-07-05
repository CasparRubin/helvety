import { fireEvent, render, screen } from "@testing-library/react";
import { Link2Icon } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { EntityLinksPanel } from "./entity-links-panel";

import type { EntityLinksPanelLabels } from "./entity-links-panel";

const labels: EntityLinksPanelLabels = {
  sectionTitle: "Linked notes",
  searchPlaceholder: "Search notes",
  emptyCatalog: "No notes yet",
  emptySearch: "No matches",
  allLinked: "All linked",
  noLinkedYet: "Nothing linked",
  unlinkTitle: "Unlink",
  unlinkDescription: (name) => `Remove link to ${name}?`,
};

/** Renders a static entity links panel with a minimal in-memory hook. */
function renderPanel(options?: {
  link?: (targetId: string) => Promise<boolean>;
  allItems?: Array<{ id: string }>;
}) {
  const link =
    options?.link ??
    vi.fn<(targetId: string) => Promise<boolean>>().mockResolvedValue(true);
  render(
    <EntityLinksPanel
      entityId="entity-1"
      labels={labels}
      sectionIcon={Link2Icon}
      pickerItemIcon={Link2Icon}
      getDeepLink={(id) => `/notes?note=${id}`}
      formatName={(item) => `Note ${item.id}`}
      variant="static"
      useLinks={() => ({
        allItems: options?.allItems ?? [{ id: "a" }, { id: "b" }],
        linkedItems: [],
        isLoading: false,
        link,
        unlink: vi.fn(),
      })}
    />
  );
  return { link };
}

describe("EntityLinksPanel", () => {
  it("opens popover picker and links a catalog row", async () => {
    const { link } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /Add/i }));
    expect(
      await screen.findByRole("textbox", { name: labels.searchPlaceholder })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Note a/i }));
    expect(link).toHaveBeenCalledWith("a");
  });

  it("filters catalog rows via the search field", async () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /Add/i }));
    const search = await screen.findByRole("textbox", {
      name: labels.searchPlaceholder,
    });
    fireEvent.change(search, { target: { value: "b" } });

    expect(
      screen.queryByRole("button", { name: /Note a/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Note b/i })).toBeInTheDocument();
  });
});
