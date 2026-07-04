/* eslint-disable jsdoc/require-jsdoc -- Vitest Konva stub; not production code */
import { vi } from "vitest";

/** Nodes passed to `layer.add` during export tests. */
export const konvaTestLayerAdds: unknown[] = [];

/** Resets captured Konva layer nodes between tests. */
export function resetKonvaTestLayerAdds(): void {
  konvaTestLayerAdds.length = 0;
}

/** Minimal Konva stub so export-image and related modules load in Vitest. */
function makeImageNode() {
  return {
    cache: vi.fn(),
    getLayer: vi.fn(() => ({ batchDraw: vi.fn() })),
  };
}

class Stage {
  add = vi.fn();
  destroyChildren = vi.fn();
  width = vi.fn();
  height = vi.fn();
  scale = vi.fn();
  toDataURL = vi.fn(() => "data:image/png;base64,AA==");
  destroy = vi.fn();
  getRelativePointerPosition = vi.fn(() => null);
}

class Layer {
  add = vi.fn((node: unknown) => {
    konvaTestLayerAdds.push(node);
  });
  draw = vi.fn();
}

class Group {
  add = vi.fn();
}

class Rect {
  attrs: Record<string, unknown>;
  constructor(attrs: Record<string, unknown> = {}) {
    this.attrs = attrs;
  }
}

class Image {
  attrs: Record<string, unknown>;
  constructor(attrs: Record<string, unknown> = {}) {
    this.attrs = attrs;
    Object.assign(this, makeImageNode());
  }
}

class Line {
  attrs: Record<string, unknown>;
  constructor(attrs: Record<string, unknown> = {}) {
    this.attrs = attrs;
  }
}

class Text {
  attrs: Record<string, unknown>;
  constructor(attrs: Record<string, unknown> = {}) {
    this.attrs = attrs;
  }
}

class Shape {}

const Konva = {
  Stage,
  Layer,
  Group,
  Rect,
  Image,
  Line,
  Shape,
  Text,
  Filters: { Blur: "blur" },
};

export default Konva;
