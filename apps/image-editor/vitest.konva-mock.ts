/* eslint-disable jsdoc/require-jsdoc -- Vitest Konva stub; not production code */
import { vi } from "vitest";

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
}

class Layer {
  add = vi.fn();
  draw = vi.fn();
}

class Group {
  add = vi.fn();
}

class Rect {}
class Image {
  constructor() {
    return makeImageNode();
  }
}
class Shape {}
class Text {}

const Konva = {
  Stage,
  Layer,
  Group,
  Rect,
  Image,
  Shape,
  Text,
  Filters: { Blur: "blur" },
};

export default Konva;
