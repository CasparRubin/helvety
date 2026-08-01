import { urls } from "@helvety/shared/config";
import { describe, expect, it, vi } from "vitest";

vi.mock("./helvety-shell-navbar", () => ({
  HelvetyShellNavbar: () => null,
}));

import {
  createPublicShellNavbar,
  publicToolNavbarBrand,
} from "./create-app-navbar";

describe("createPublicShellNavbar", () => {
  it("names the navbar from the brand currentApp", () => {
    const Navbar = createPublicShellNavbar({
      brand: publicToolNavbarBrand("PDF"),
      aboutDescription: "About PDF",
      versionLabel: null,
      navigationMenuDescription: "Navigate",
    });

    expect(Navbar.displayName).toBe("PDFNavbar");
  });
});

describe("publicToolNavbarBrand", () => {
  it("points the mark home link at helvety.com", () => {
    expect(publicToolNavbarBrand("OCR", "OCR Tools")).toEqual({
      currentApp: "OCR",
      homeHref: urls.home,
      homeAriaLabel: "Visit Helvety.com",
      titleText: "OCR Tools",
      titleHref: "/",
    });
  });
});
