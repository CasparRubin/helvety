import { CONTACT_EMAIL, urls } from "@helvety/shared/config";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Footer } from "./footer";

describe("Footer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps an explicit separator between year and Helvety copy", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-05T12:00:00.000Z"));

    render(<Footer />);

    const copyrightLine = screen.getByText(/Helvety/);
    expect(copyrightLine.textContent).toContain("© 2026\u00A0Helvety");
    expect(copyrightLine.textContent).not.toContain("essential cookies");
    expect(copyrightLine.textContent).not.toContain("theme preference");
    expect(copyrightLine.textContent).not.toContain("authentication cookies");
    expect(copyrightLine.textContent).not.toMatch(/\bthird-party analytics\b/i);
  });

  it("renders absolute legal links by default for embedded apps", () => {
    render(<Footer />);

    const impressumLink = screen.getByRole("link", { name: "Impressum" });
    expect(impressumLink).toHaveAttribute("href", `${urls.home}/impressum`);
    expect(impressumLink).toHaveAttribute("target", "_blank");
    expect(impressumLink).toHaveAttribute("rel", "noopener noreferrer");

    const privacyLink = screen.getByRole("link", { name: "Privacy" });
    expect(privacyLink).toHaveAttribute("href", `${urls.home}/privacy`);
    expect(privacyLink).toHaveAttribute("target", "_blank");

    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`
    );
  });

  it("supports relative legal links when external is false", () => {
    render(<Footer external={false} />);

    const privacyLink = screen.getByRole("link", { name: "Privacy" });
    expect(privacyLink).toHaveAttribute("href", "/privacy");
    expect(privacyLink).not.toHaveAttribute("target");
  });
});
