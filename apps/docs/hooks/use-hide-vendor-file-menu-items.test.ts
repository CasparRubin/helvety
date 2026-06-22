import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useHideVendorFileMenuItems } from "./use-hide-vendor-file-menu-items";

/** Build `.ep-root` + title bar with vendor File menu items for hook tests. */
function mountEpRootWithFileMenu(host: HTMLElement): HTMLElement {
  const epRoot = document.createElement("div");
  epRoot.className = "ep-root";
  const titleBar = document.createElement("div");
  titleBar.setAttribute("data-testid", "title-bar");
  for (const label of ["Open", "Save", "New document"]) {
    const item = document.createElement("div");
    item.setAttribute("role", "menuitem");
    item.textContent = label;
    titleBar.appendChild(item);
  }
  epRoot.appendChild(titleBar);
  host.appendChild(epRoot);
  return epRoot;
}

/** Mount `.ep-root` with an empty title bar (no menu items yet). */
function mountTitleBar(host: HTMLElement): {
  epRoot: HTMLElement;
  titleBar: HTMLElement;
} {
  const epRoot = document.createElement("div");
  epRoot.className = "ep-root";
  const titleBar = document.createElement("div");
  titleBar.setAttribute("data-testid", "title-bar");
  epRoot.appendChild(titleBar);
  host.appendChild(epRoot);
  return { epRoot, titleBar };
}

describe("useHideVendorFileMenuItems", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("hides vendor Open, Save, and New File menu items when .ep-root mounts after the effect", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const rootRef = { current: host };

    renderHook(() => useHideVendorFileMenuItems(rootRef));

    const epRoot = mountEpRootWithFileMenu(host);

    await waitFor(() => {
      for (const item of epRoot.querySelectorAll('[role="menuitem"]')) {
        expect((item as HTMLElement).style.display).toBe("none");
      }
    });
  });

  it("hides prefixed vendor labels such as Save as and Open recent", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const rootRef = { current: host };

    renderHook(() => useHideVendorFileMenuItems(rootRef));

    const epRoot = document.createElement("div");
    epRoot.className = "ep-root";
    const titleBar = document.createElement("div");
    titleBar.setAttribute("data-testid", "title-bar");
    for (const label of ["Open recent", "Save as", "New from template"]) {
      const item = document.createElement("div");
      item.setAttribute("role", "menuitem");
      item.textContent = label;
      titleBar.appendChild(item);
    }
    epRoot.appendChild(titleBar);
    host.appendChild(epRoot);

    await waitFor(() => {
      for (const item of titleBar.querySelectorAll('[role="menuitem"]')) {
        expect((item as HTMLElement).style.display).toBe("none");
      }
    });
  });

  it("does not hide unrelated File menu entries such as Print", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const rootRef = { current: host };

    renderHook(() => useHideVendorFileMenuItems(rootRef));

    const epRoot = mountEpRootWithFileMenu(host);
    const printItem = document.createElement("div");
    printItem.setAttribute("role", "menuitem");
    printItem.textContent = "Print";
    epRoot.querySelector('[data-testid="title-bar"]')?.appendChild(printItem);

    await waitFor(() => {
      expect(printItem.style.display).not.toBe("none");
    });
  });

  it("does not hide menu items before the title bar is mounted", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const rootRef = { current: host };

    renderHook(() => useHideVendorFileMenuItems(rootRef));

    const epRoot = document.createElement("div");
    epRoot.className = "ep-root";
    const outsideItem = document.createElement("div");
    outsideItem.setAttribute("role", "menuitem");
    outsideItem.textContent = "Open";
    epRoot.appendChild(outsideItem);
    host.appendChild(epRoot);

    await waitFor(() => {
      expect(host.querySelector('[data-testid="title-bar"]')).toBeNull();
    });

    expect(outsideItem.style.display).not.toBe("none");
  });

  it("hides menu items added to the title bar after attach", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const rootRef = { current: host };

    renderHook(() => useHideVendorFileMenuItems(rootRef));

    const { titleBar } = mountTitleBar(host);

    await waitFor(() => {
      expect(host.querySelector('[data-testid="title-bar"]')).not.toBeNull();
    });

    const lateOpen = document.createElement("div");
    lateOpen.setAttribute("role", "menuitem");
    lateOpen.textContent = "Open";
    titleBar.appendChild(lateOpen);

    await waitFor(() => {
      expect(lateOpen.style.display).toBe("none");
    });
  });

  it("hides portaled File menu items added as direct children of .ep-root", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const rootRef = { current: host };

    renderHook(() => useHideVendorFileMenuItems(rootRef));

    const { epRoot } = mountTitleBar(host);

    await waitFor(() => {
      expect(host.querySelector('[data-testid="title-bar"]')).not.toBeNull();
    });

    const portaledOpen = document.createElement("div");
    portaledOpen.setAttribute("role", "menuitem");
    portaledOpen.textContent = "Open";
    epRoot.appendChild(portaledOpen);

    await waitFor(() => {
      expect(portaledOpen.style.display).toBe("none");
    });
  });
});
