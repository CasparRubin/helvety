import { fireEvent, render, screen } from "@testing-library/react";
import { Trash2Icon } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { RowActionButton } from "./row-action-button";
import { TooltipProvider } from "./tooltip";

describe("RowActionButton", () => {
  it("exposes the action via aria-label without a tooltip by default", () => {
    render(
      <RowActionButton label="Delete item" onClick={vi.fn()}>
        <Trash2Icon />
      </RowActionButton>
    );

    expect(
      screen.getByRole("button", { name: "Delete item" })
    ).toBeInTheDocument();
  });

  it("forwards click and stops row propagation by default", () => {
    const onRowClick = vi.fn();
    const onActionClick = vi.fn();

    render(
      <div onClick={onRowClick} onKeyDown={undefined} role="presentation">
        <RowActionButton label="Delete" onClick={onActionClick}>
          <Trash2Icon />
        </RowActionButton>
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onActionClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("allows row propagation when stopPropagation is false", () => {
    const onRowClick = vi.fn();
    const onActionClick = vi.fn();

    render(
      <div onClick={onRowClick} onKeyDown={undefined} role="presentation">
        <RowActionButton
          label="Delete"
          stopPropagation={false}
          onClick={onActionClick}
        >
          <Trash2Icon />
        </RowActionButton>
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onActionClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it("forwards disabled to the underlying button", () => {
    render(
      <RowActionButton label="Delete" disabled onClick={vi.fn()}>
        <Trash2Icon />
      </RowActionButton>
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("forwards disabled through the tooltip branch", () => {
    render(
      <TooltipProvider>
        <RowActionButton showTooltip label="Delete" disabled onClick={vi.fn()}>
          <Trash2Icon />
        </RowActionButton>
      </TooltipProvider>
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("uses ghost icon-sm styling defaults for list rows", () => {
    render(
      <RowActionButton label="Edit" onClick={vi.fn()}>
        <Trash2Icon />
      </RowActionButton>
    );

    const button = screen.getByRole("button", { name: "Edit" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button.className).toContain("text-muted-foreground");
  });
});
