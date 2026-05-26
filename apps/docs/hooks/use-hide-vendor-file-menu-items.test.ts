import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useHideVendorFileMenuItems } from "./use-hide-vendor-file-menu-items";

describe("useHideVendorFileMenuItems", () => {
  it("hides vendor File → Open, Save, and New menu items inside .ep-root", () => {
    const host = document.createElement("div");
    const root = document.createElement("div");
    root.className = "ep-root";
    const openItem = document.createElement("div");
    openItem.setAttribute("role", "menuitem");
    openItem.textContent = "Open Ctrl+O";
    const saveItem = document.createElement("div");
    saveItem.setAttribute("role", "menuitem");
    saveItem.textContent = "Save Ctrl+S";
    const newItem = document.createElement("div");
    newItem.setAttribute("role", "menuitem");
    newItem.textContent = "New document";
    const printItem = document.createElement("div");
    printItem.setAttribute("role", "menuitem");
    printItem.textContent = "Print Ctrl+P";
    root.append(openItem, saveItem, newItem, printItem);
    host.append(root);
    document.body.append(host);

    const ref = { current: host };
    renderHook(() => useHideVendorFileMenuItems(ref));

    expect(openItem.style.display).toBe("none");
    expect(saveItem.style.display).toBe("none");
    expect(newItem.style.display).toBe("none");
    expect(printItem.style.display).not.toBe("none");

    host.remove();
  });
});
