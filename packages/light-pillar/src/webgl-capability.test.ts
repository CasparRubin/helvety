import { afterEach, describe, expect, it, vi } from "vitest";

import { canUseWebGL } from "./webgl-capability";

describe("canUseWebGL", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when getContext yields null", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    expect(canUseWebGL()).toBe(false);
  });

  it("returns true when a WebGL context can be created", () => {
    const loseContext = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getExtension: () => ({ loseContext }),
    } as unknown as WebGLRenderingContext);

    expect(canUseWebGL()).toBe(true);
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it("returns false when getContext throws", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => {
        throw new Error("webgl blocked");
      }
    );

    expect(canUseWebGL()).toBe(false);
  });
});
