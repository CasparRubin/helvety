import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createBlurElement,
  createBorderElement,
  createTextElement,
} from "@/lib/editor-reducer";

import { LayersPanel } from "./layers-panel";

describe("LayersPanel", () => {
  it("shows empty state when there are no layers", () => {
    render(
      <LayersPanel
        elements={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(
      screen.getByText("No layers yet. Use a tool to add annotations.")
    ).toBeInTheDocument();
  });

  it("lists layers and wires select, reorder, and delete callbacks", () => {
    const border = createBorderElement(0, 0, 100, 50);
    const text = createTextElement(10, 10);
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const onReorder = vi.fn();

    render(
      <LayersPanel
        elements={[border, text]}
        selectedId={border.id}
        onSelect={onSelect}
        onDelete={onDelete}
        onReorder={onReorder}
        onUpdate={vi.fn()}
      />
    );

    const borderRow = screen
      .getByRole("button", { name: /Border/ })
      .closest("li");
    expect(borderRow).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Border/ }));
    fireEvent.click(
      within(borderRow!).getByRole("button", { name: "Delete layer" })
    );
    fireEvent.click(
      within(borderRow!).getByRole("button", { name: "Move layer up" })
    );

    expect(onSelect).toHaveBeenCalledWith(border.id);
    expect(onDelete).toHaveBeenCalledWith(border.id);
    expect(onReorder).toHaveBeenCalledWith(border.id, "up");
  });

  it("disables move-down on the bottom layer and move-up on the top layer", () => {
    const bottom = createBorderElement(0, 0, 10, 10);
    const top = createTextElement(1, 1);

    render(
      <LayersPanel
        elements={[bottom, top]}
        selectedId={null}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    const bottomRow = screen
      .getByRole("button", { name: /Border/ })
      .closest("li");
    const topRow = screen.getByRole("button", { name: /Text/ }).closest("li");
    expect(bottomRow).not.toBeNull();
    expect(topRow).not.toBeNull();

    expect(
      within(bottomRow!).getByRole("button", { name: "Move layer down" })
    ).toBeDisabled();
    expect(
      within(topRow!).getByRole("button", { name: "Move layer up" })
    ).toBeDisabled();
  });

  it("wires property updates for the selected element", () => {
    const blur = createBlurElement(0, 0, 40, 30);
    const onUpdate = vi.fn();

    render(
      <LayersPanel
        elements={[blur]}
        selectedId={blur.id}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    fireEvent.change(screen.getByLabelText("Blur radius"), {
      target: { value: "24" },
    });
    fireEvent.change(screen.getByLabelText("Width"), {
      target: { value: "80" },
    });

    expect(onUpdate).toHaveBeenCalledWith(blur.id, { blurRadius: 24 });
    expect(onUpdate).toHaveBeenCalledWith(blur.id, { width: 80 });
  });
});
