import { describe, expect, it, vi } from "vitest";

import { waitForShellContentPainted } from "./wait-for-shell-content-painted";

describe("waitForShellContentPainted", () => {
  it("resolves after two animation frames", async () => {
    const raf = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });

    await waitForShellContentPainted();

    expect(raf).toHaveBeenCalledTimes(2);
    raf.mockRestore();
  });
});
