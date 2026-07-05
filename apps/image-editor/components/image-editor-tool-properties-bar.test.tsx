import { getRangeInputByLabel } from "@helvety/shared/test-utils/base-ui-test-helpers";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createArrowElement,
  createBlurElement,
  createBorderElement,
  createHighlightElement,
  createTextElement,
} from "@/lib/editor-reducer";
import {
  DEFAULT_BLUR_RADIUS,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_STROKE,
  SLIDER_MAX_PX,
} from "@/lib/editor-types";

import { ImageEditorToolPropertiesBar } from "./image-editor-tool-properties-bar";

import type { ComponentProps } from "react";

/** Props for {@link ImageEditorToolPropertiesBar} in tests. */
type ToolPropertiesBarProps = ComponentProps<
  typeof ImageEditorToolPropertiesBar
>;

/** Renders the tool properties bar with defaults overridable per test. */
function renderToolPropertiesBar(
  props: Partial<ToolPropertiesBarProps> &
    Pick<ToolPropertiesBarProps, "activeTool">
) {
  const defaults: ToolPropertiesBarProps = {
    hasImage: true,
    elements: [],
    selectedId: null,
    toolColor: DEFAULT_STROKE,
    toolStrokeWidth: 5,
    toolBlurRadius: DEFAULT_BLUR_RADIUS,
    toolDimOpacity: 0.55,
    toolCornerRadius: DEFAULT_CORNER_RADIUS,
    onToolColorChange: vi.fn(),
    onToolStrokeWidthChange: vi.fn(),
    onToolBlurRadiusChange: vi.fn(),
    onToolDimOpacityChange: vi.fn(),
    onToolCornerRadiusChange: vi.fn(),
    onUpdate: vi.fn(),
    ...props,
  };

  return render(<ImageEditorToolPropertiesBar {...defaults} />);
}

describe("ImageEditorToolPropertiesBar", () => {
  it("shows placeholder when no image is loaded", () => {
    renderToolPropertiesBar({ hasImage: false, activeTool: "select" });

    expect(
      screen.getByText("Open an image to edit tool properties.")
    ).toBeInTheDocument();
  });

  it("shows tool color when a drawing tool is active", () => {
    const onToolColorChange = vi.fn();
    renderToolPropertiesBar({ activeTool: "arrow", onToolColorChange });

    fireEvent.change(screen.getByLabelText("Color"), {
      target: { value: "#aabbcc" },
    });

    expect(onToolColorChange).toHaveBeenCalledWith("#aabbcc");
  });

  it("shows blur radius slider without a color picker", () => {
    renderToolPropertiesBar({ activeTool: "blur" });

    expect(getRangeInputByLabel(screen, "Blur")).toHaveAttribute(
      "aria-valuenow",
      String(DEFAULT_BLUR_RADIUS)
    );
    expect(getRangeInputByLabel(screen, "Radius")).toHaveAttribute(
      "aria-valuenow",
      String(DEFAULT_CORNER_RADIUS)
    );
    expect(screen.queryByLabelText("Color")).not.toBeInTheDocument();
  });

  it("shows selected element properties in select mode", () => {
    const text = createTextElement(0, 0, undefined, {
      imageWidth: 1920,
      imageHeight: 1080,
    });
    const onUpdate = vi.fn();

    renderToolPropertiesBar({
      activeTool: "select",
      elements: [text],
      selectedId: text.id,
      onUpdate,
    });

    fireEvent.change(screen.getByLabelText("Text"), {
      target: { value: "Hello" },
    });

    expect(onUpdate).toHaveBeenCalledWith(text.id, { text: "Hello" });
  });

  it("shows highlight dim slider without a color picker", () => {
    renderToolPropertiesBar({ activeTool: "highlight" });

    expect(getRangeInputByLabel(screen, "Dim")).toHaveAttribute(
      "aria-valuenow",
      "0.55"
    );
    expect(getRangeInputByLabel(screen, "Radius")).toHaveAttribute(
      "aria-valuenow",
      String(DEFAULT_CORNER_RADIUS)
    );
    expect(screen.queryByLabelText("Color")).not.toBeInTheDocument();
  });

  it("wires tool blur radius while the blur tool is active", () => {
    const onToolBlurRadiusChange = vi.fn();
    renderToolPropertiesBar({
      activeTool: "blur",
      onToolBlurRadiusChange,
    });

    const slider = getRangeInputByLabel(screen, "Blur");
    slider.focus();
    fireEvent.keyDown(slider, { key: "ArrowRight" });

    expect(onToolBlurRadiusChange).toHaveBeenCalledWith(
      DEFAULT_BLUR_RADIUS + 1
    );
  });

  it("wires tool dim opacity while the highlight tool is active", () => {
    const onToolDimOpacityChange = vi.fn();
    renderToolPropertiesBar({
      activeTool: "highlight",
      onToolDimOpacityChange,
    });

    const slider = getRangeInputByLabel(screen, "Dim");
    slider.focus();
    fireEvent.keyDown(slider, { key: "ArrowLeft" });

    expect(onToolDimOpacityChange).toHaveBeenCalledWith(0.5);
  });

  it("shows crop guidance when the crop tool is active", () => {
    renderToolPropertiesBar({ activeTool: "crop" });

    expect(
      screen.getByText(/Apply Crop in the main command bar/)
    ).toBeInTheDocument();
  });

  it("wires tool stroke width for border drawing", () => {
    const onToolStrokeWidthChange = vi.fn();
    renderToolPropertiesBar({
      activeTool: "border",
      onToolStrokeWidthChange,
    });

    const slider = getRangeInputByLabel(screen, "Stroke");
    expect(slider).toHaveAttribute("aria-valuenow", "5");

    slider.focus();
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onToolStrokeWidthChange).toHaveBeenCalledWith(6);
  });

  it("updates selected arrow stroke and width in select mode", () => {
    const arrow = createArrowElement(0, 0, 100, 50, "#112233", {
      imageWidth: 1920,
      imageHeight: 1080,
      strokeWidth: 6,
    });
    const onUpdate = vi.fn();

    renderToolPropertiesBar({
      activeTool: "select",
      elements: [arrow],
      selectedId: arrow.id,
      onUpdate,
    });

    fireEvent.change(screen.getByLabelText("Color"), {
      target: { value: "#aabbcc" },
    });
    const strokeSlider = getRangeInputByLabel(screen, "Stroke");
    strokeSlider.focus();
    fireEvent.keyDown(strokeSlider, { key: "ArrowRight" });

    expect(onUpdate).toHaveBeenCalledWith(arrow.id, { stroke: "#aabbcc" });
    expect(onUpdate).toHaveBeenCalledWith(arrow.id, { strokeWidth: 7 });
  });

  it("updates selected highlight dim and dimensions", () => {
    const highlight = createHighlightElement(10, 20, 100, 80);
    const onUpdate = vi.fn();

    renderToolPropertiesBar({
      activeTool: "select",
      elements: [highlight],
      selectedId: highlight.id,
      onUpdate,
    });

    const dimSlider = getRangeInputByLabel(screen, "Dim");
    dimSlider.focus();
    fireEvent.keyDown(dimSlider, { key: "ArrowLeft" });
    fireEvent.change(screen.getByLabelText("W"), {
      target: { value: "120" },
    });
    fireEvent.change(screen.getByLabelText("H"), {
      target: { value: "90" },
    });

    expect(onUpdate).toHaveBeenCalledWith(highlight.id, { dimOpacity: 0.5 });
    expect(onUpdate).toHaveBeenCalledWith(highlight.id, { width: 120 });
    expect(onUpdate).toHaveBeenCalledWith(highlight.id, { height: 90 });
  });

  it("updates selected blur radius and dimensions", () => {
    const blur = createBlurElement(5, 5, 50, 40);
    const onUpdate = vi.fn();

    renderToolPropertiesBar({
      activeTool: "select",
      elements: [blur],
      selectedId: blur.id,
      onUpdate,
    });

    const blurSlider = getRangeInputByLabel(screen, "Blur");
    blurSlider.focus();
    fireEvent.keyDown(blurSlider, { key: "ArrowRight" });

    expect(onUpdate).toHaveBeenCalledWith(blur.id, {
      blurRadius: DEFAULT_BLUR_RADIUS + 1,
    });
  });

  it("updates selected border dimensions", () => {
    const border = createBorderElement(0, 0, 80, 60, "#ff0000");
    const onUpdate = vi.fn();

    renderToolPropertiesBar({
      activeTool: "select",
      elements: [border],
      selectedId: border.id,
      onUpdate,
    });

    fireEvent.change(screen.getByLabelText("W"), {
      target: { value: "100" },
    });

    expect(onUpdate).toHaveBeenCalledWith(border.id, { width: 100 });
  });

  it("allows stroke values above the slider max via number input", () => {
    const onToolStrokeWidthChange = vi.fn();
    renderToolPropertiesBar({
      activeTool: "border",
      onToolStrokeWidthChange,
    });

    fireEvent.change(screen.getByLabelText("Stroke value"), {
      target: { value: "150" },
    });

    expect(onToolStrokeWidthChange).toHaveBeenCalledWith(150);
  });

  it("allows blur values above the slider max via number input", () => {
    const onToolBlurRadiusChange = vi.fn();
    renderToolPropertiesBar({
      activeTool: "blur",
      onToolBlurRadiusChange,
    });

    fireEvent.change(screen.getByLabelText("Blur value"), {
      target: { value: String(SLIDER_MAX_PX + 50) },
    });

    expect(onToolBlurRadiusChange).toHaveBeenCalledWith(SLIDER_MAX_PX + 50);
  });

  it("updates selected corner radius for rect annotations", () => {
    const border = createBorderElement(0, 0, 80, 60, "#ff0000");
    const onUpdate = vi.fn();

    renderToolPropertiesBar({
      activeTool: "select",
      elements: [border],
      selectedId: border.id,
      onUpdate,
    });

    fireEvent.change(screen.getByLabelText("Radius value"), {
      target: { value: "0" },
    });

    expect(onUpdate).toHaveBeenCalledWith(border.id, { cornerRadius: 0 });
  });

  it("caps the stroke slider thumb at the slider max while keeping a higher input value", () => {
    renderToolPropertiesBar({
      activeTool: "border",
      toolStrokeWidth: SLIDER_MAX_PX + 25,
    });

    expect(getRangeInputByLabel(screen, "Stroke")).toHaveAttribute(
      "aria-valuenow",
      String(SLIDER_MAX_PX)
    );
    expect(screen.getByLabelText("Stroke value")).toHaveValue(
      SLIDER_MAX_PX + 25
    );
  });
});
