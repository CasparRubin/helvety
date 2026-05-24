import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LinksTreeList } from "./links-tree-list";

describe("LinksTreeList", () => {
  it("shows the empty library message when there are no folders or links", () => {
    render(
      <LinksTreeList
        folders={[]}
        links={[]}
        expandedFolderIds={new Set()}
        onToggleFolder={vi.fn()}
        onEditLink={vi.fn()}
        onEditFolder={vi.fn()}
        onTreeDrop={vi.fn(async () => true)}
        onExpandFolder={vi.fn()}
      />
    );

    expect(
      screen.getByText(
        "No bookmarks yet. Create a folder or link to get started."
      )
    ).toBeInTheDocument();
  });
});
