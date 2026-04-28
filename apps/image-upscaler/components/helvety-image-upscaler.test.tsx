import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelvetyImageUpscaler } from "@/components/helvety-image-upscaler";

describe("HelvetyImageUpscaler", () => {
  it("renders empty state and default runtime text", () => {
    render(<HelvetyImageUpscaler />);

    expect(screen.getByText("Drag and drop images here")).toBeInTheDocument();
    expect(screen.getByText("Runtime: pending")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upscale" })).toBeDisabled();
  });

  it("shows target input controls when target dimension mode is selected", () => {
    render(<HelvetyImageUpscaler />);

    const [modeSelect] = screen.getAllByRole("combobox");
    expect(modeSelect).toBeDefined();
    if (!modeSelect) {
      throw new Error("Mode select was not rendered.");
    }
    fireEvent.change(modeSelect, { target: { value: "target" } });

    expect(screen.getByDisplayValue("Width")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2048")).toBeInTheDocument();
  });
});
