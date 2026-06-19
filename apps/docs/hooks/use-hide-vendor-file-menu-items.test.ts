import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useHideVendorFileMenuItems } from "./use-hide-vendor-file-menu-items";

describe("useHideVendorFileMenuItems", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("hides vendor Open, Save, and New File menu items", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const rootRef = { current: host };

    renderHook(() => useHideVendorFileMenuItems(rootRef));

    const epRoot = document.createElement("div");
    epRoot.className = "ep-root";
    for (const label of ["Open", "Save", "New document"]) {
      const item = document.createElement("div");
      item.setAttribute("role", "menuitem");
      item.textContent = label;
      epRoot.appendChild(item);
    }
    host.appendChild(epRoot);

    await waitFor(() => {
      for (const item of epRoot.querySelectorAll('[role="menuitem"]')) {
        expect((item as HTMLElement).style.display).toBe("none");
      }
    });
  });

  it("hides vendor File menu items when .ep-root mounts after the effect runs", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const rootRef = { current: host };

    renderHook(() => useHideVendorFileMenuItems(rootRef));

    const epRoot = document.createElement("div");
    epRoot.className = "ep-root";
    const openItem = document.createElement("div");
    openItem.setAttribute("role", "menuitem");
    openItem.textContent = "Open";
    epRoot.appendChild(openItem);
    host.appendChild(epRoot);

    await waitFor(() => {
      expect(openItem.style.display).toBe("none");
    });
  });
});
