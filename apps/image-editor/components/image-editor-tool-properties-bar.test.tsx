import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createArrowElement,
  createBlurElement,
  createBorderElement,
  createHighlightElement,
  createTextElement,
} from "@/lib/editor-reducer";

import { ImageEditorToolPropertiesBar } from "./image-editor-tool-properties-bar";

describe("ImageEditorToolPropertiesBar", () => {
  it("shows placeholder when no image is loaded", () => {
    render(
      <ImageEditorToolPropertiesBar
        hasImage={false}
        activeTool="select"
        elements={[]}
        selectedId={null}
        toolColor="#ef4444"
        toolStrokeWidth={5}
        onToolColorChange={vi.fn()}
        onToolStrokeWidthChange={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(
      screen.getByText("Open an image to edit tool properties.")
    ).toBeInTheDocument();
  });

  it("shows tool color when a drawing tool is active", () => {
    const onToolColorChange = vi.fn();
    render(
      <ImageEditorToolPropertiesBar
        hasImage
        activeTool="arrow"
        elements={[]}
        selectedId={null}
        toolColor="#112233"
        toolStrokeWidth={5}
        onToolColorChange={onToolColorChange}
        onToolStrokeWidthChange={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Color"), {
      target: { value: "#aabbcc" },
    });

    expect(onToolColorChange).toHaveBeenCalledWith("#aabbcc");
  });

  it("shows blur defaults without a color picker", () => {
    render(
      <ImageEditorToolPropertiesBar
        hasImage
        activeTool="blur"
        elements={[]}
        selectedId={null}
        toolColor="#ef4444"
        toolStrokeWidth={5}
        onToolColorChange={vi.fn()}
        onToolStrokeWidthChange={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText(/Default blur radius/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Color")).not.toBeInTheDocument();
  });

  it("shows selected element properties in select mode", () => {
    const text = createTextElement(0, 0, undefined, {
      imageWidth: 1920,
      imageHeight: 1080,
    });
    const onUpdate = vi.fn();

    render(
      <ImageEditorToolPropertiesBar
        hasImage
        activeTool="select"
        elements={[text]}
        selectedId={text.id}
        toolColor="#ef4444"
        toolStrokeWidth={5}
        onToolColorChange={vi.fn()}
        onToolStrokeWidthChange={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    fireEvent.change(screen.getByLabelText("Text"), {
      target: { value: "Hello" },
    });

    expect(onUpdate).toHaveBeenCalledWith(text.id, { text: "Hello" });
  });

  it("shows highlight dim defaults without a color picker", () => {
    render(
      <ImageEditorToolPropertiesBar
        hasImage
        activeTool="highlight"
        elements={[]}
        selectedId={null}
        toolColor="#ef4444"
        toolStrokeWidth={5}
        onToolColorChange={vi.fn()}
        onToolStrokeWidthChange={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText(/Default dim opacity/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Color")).not.toBeInTheDocument();
  });

  it("shows crop guidance when the crop tool is active", () => {
    render(
      <ImageEditorToolPropertiesBar
        hasImage
        activeTool="crop"
        elements={[]}
        selectedId={null}
        toolColor="#ef4444"
        toolStrokeWidth={5}
        onToolColorChange={vi.fn()}
        onToolStrokeWidthChange={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Apply Crop in the main command bar/)
    ).toBeInTheDocument();
  });

  it("wires tool stroke width for border drawing", () => {
    const onToolStrokeWidthChange = vi.fn();
    render(
      <ImageEditorToolPropertiesBar
        hasImage
        activeTool="border"
        elements={[]}
        selectedId={null}
        toolColor="#ef4444"
        toolStrokeWidth={5}
        onToolColorChange={vi.fn()}
        onToolStrokeWidthChange={onToolStrokeWidthChange}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Stroke"), {
      target: { value: "8" },
    });

    expect(onToolStrokeWidthChange).toHaveBeenCalledWith(8);
  });

  it("updates selected arrow stroke and width in select mode", () => {
    const arrow = createArrowElement(0, 0, 100, 50, "#112233", {
      imageWidth: 1920,
      imageHeight: 1080,
      strokeWidth: 6,
    });
    const onUpdate = vi.fn();

    render(
      <ImageEditorToolPropertiesBar
        hasImage
        activeTool="select"
        elements={[arrow]}
        selectedId={arrow.id}
        toolColor="#ef4444"
        toolStrokeWidth={5}
        onToolColorChange={vi.fn()}
        onToolStrokeWidthChange={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    fireEvent.change(screen.getByLabelText("Color"), {
      target: { value: "#aabbcc" },
    });
    fireEvent.change(screen.getByLabelText("Stroke"), {
      target: { value: "10" },
    });

    expect(onUpdate).toHaveBeenCalledWith(arrow.id, { stroke: "#aabbcc" });
    expect(onUpdate).toHaveBeenCalledWith(arrow.id, { strokeWidth: 10 });
  });

  it("updates selected highlight dim and dimensions", () => {
    const highlight = createHighlightElement(10, 20, 100, 80);
    const onUpdate = vi.fn();

    render(
      <ImageEditorToolPropertiesBar
        hasImage
        activeTool="select"
        elements={[highlight]}
        selectedId={highlight.id}
        toolColor="#ef4444"
        toolStrokeWidth={5}
        onToolColorChange={vi.fn()}
        onToolStrokeWidthChange={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    fireEvent.change(screen.getByLabelText("Dim"), {
      target: { value: "0.5" },
    });
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

    render(
      <ImageEditorToolPropertiesBar
        hasImage
        activeTool="select"
        elements={[blur]}
        selectedId={blur.id}
        toolColor="#ef4444"
        toolStrokeWidth={5}
        onToolColorChange={vi.fn()}
        onToolStrokeWidthChange={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    fireEvent.change(screen.getByLabelText("Blur", { selector: "input" }), {
      target: { value: "18" },
    });

    expect(onUpdate).toHaveBeenCalledWith(blur.id, { blurRadius: 18 });
  });

  it("updates selected border dimensions", () => {
    const border = createBorderElement(0, 0, 80, 60, "#ff0000");
    const onUpdate = vi.fn();

    render(
      <ImageEditorToolPropertiesBar
        hasImage
        activeTool="select"
        elements={[border]}
        selectedId={border.id}
        toolColor="#ef4444"
        toolStrokeWidth={5}
        onToolColorChange={vi.fn()}
        onToolStrokeWidthChange={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    fireEvent.change(screen.getByLabelText("W"), {
      target: { value: "100" },
    });

    expect(onUpdate).toHaveBeenCalledWith(border.id, { width: 100 });
  });
});
