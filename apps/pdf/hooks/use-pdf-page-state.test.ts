import * as React from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePdfPageState } from "./use-pdf-page-state";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

/** Mounts `usePdfPageState` for hook-level tests. */
function renderUsePdfPageStateHook(pageOrder: ReadonlyArray<number>): {
  getCurrent: () => ReturnType<typeof usePdfPageState>;
  rerender: (nextOrder: ReadonlyArray<number>) => void;
  unmount: () => void;
} {
  let current: ReturnType<typeof usePdfPageState> | null = null;
  let order = pageOrder;
  const container = document.createElement("div");
  const root = createRoot(container);

  /** Captures the latest hook snapshot. */
  function Harness(): null {
    const value = usePdfPageState(order);
    React.useEffect(() => {
      current = value;
    }, [value]);
    return null;
  }

  React.act(() => {
    root.render(React.createElement(Harness));
  });

  return {
    getCurrent: () => {
      if (!current) {
        throw new Error("Hook did not initialize");
      }
      return current;
    },
    rerender: (nextOrder) => {
      order = nextOrder;
      React.act(() => {
        root.render(React.createElement(Harness));
      });
    },
    unmount: () => {
      React.act(() => {
        root.unmount();
      });
    },
  };
}

describe("usePdfPageState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks deleted and rotated page counts from pageOrder", () => {
    const hook = renderUsePdfPageStateHook([1, 2, 3]);
    const onError = vi.fn();

    React.act(() => {
      hook.getCurrent().toggleDelete(1, 3, onError);
      hook.getCurrent().rotatePage(2, 90, onError);
    });

    expect(hook.getCurrent().deletedCount).toBe(1);
    expect(hook.getCurrent().rotatedCount).toBe(1);
    expect(hook.getCurrent().deletedPages.has(1)).toBe(true);
    expect(hook.getCurrent().pageRotations[2]).toBe(90);
    hook.unmount();
  });

  it("prevents deleting the last remaining page", () => {
    const hook = renderUsePdfPageStateHook([1, 2]);
    const onError = vi.fn();

    React.act(() => {
      hook.getCurrent().toggleDelete(1, 2, onError);
      hook.getCurrent().toggleDelete(2, 2, onError);
    });

    expect(onError).toHaveBeenLastCalledWith(
      "Cannot delete all pages. At least one page must remain in the document."
    );
    expect(hook.getCurrent().deletedPages.size).toBe(1);
    hook.unmount();
  });

  it("normalizes rotation angles and supports resetRotation / resetAll", () => {
    const hook = renderUsePdfPageStateHook([1]);
    const onError = vi.fn();

    React.act(() => {
      hook.getCurrent().rotatePage(1, 270, onError);
      hook.getCurrent().rotatePage(1, 90, onError);
    });

    expect(hook.getCurrent().pageRotations[1]).toBe(0);

    React.act(() => {
      hook.getCurrent().rotatePage(1, 180, onError);
      hook.getCurrent().resetRotation(1, onError);
    });

    expect(hook.getCurrent().pageRotations[1]).toBeUndefined();
    expect(hook.getCurrent().rotatedCount).toBe(0);

    React.act(() => {
      hook.getCurrent().toggleDelete(1, 2, onError);
      hook.getCurrent().rotatePage(2, 90, onError);
      hook.getCurrent().resetAll(onError);
    });

    expect(hook.getCurrent().deletedPages.size).toBe(0);
    expect(hook.getCurrent().pageRotations).toEqual({});
    hook.unmount();
  });
});
