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

    const copyrightLine = screen.getByText(
      /This site uses essential cookies and similar storage for security/
    );
    expect(copyrightLine.textContent).toContain("© 2026\u00A0Helvety");
    expect(copyrightLine.textContent).toContain(
      "essential cookies and similar storage"
    );
    expect(copyrightLine.textContent).toContain("theme preference");
    expect(copyrightLine.textContent).toContain("storage details");
    expect(copyrightLine.textContent).not.toContain("authentication cookies");
    expect(copyrightLine.textContent).not.toMatch(/\bthird-party analytics\b/i);
    expect(copyrightLine.textContent).not.toContain("account-based services");
    expect(copyrightLine.textContent).not.toContain(
      "similar storage technologies for security"
    );
  });

  it("links Privacy from the cookie notice", () => {
    render(<Footer external={false} />);

    const copyrightLine = screen.getByText(/for example theme preference/);
    const privacyInNotice = copyrightLine.querySelector('a[href="/privacy"]');
    expect(privacyInNotice).toHaveTextContent("Privacy");
  });

  it("uses absolute Privacy link in cookie notice for embedded apps", () => {
    render(<Footer />);

    const copyrightLine = screen.getByText(/for example theme preference/);
    const privacyInNotice = copyrightLine.querySelector(
      `a[href="${urls.home}/privacy"]`
    );
    expect(privacyInNotice).toHaveTextContent("Privacy");
    expect(privacyInNotice).toHaveAttribute("target", "_blank");
    expect(privacyInNotice).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders absolute legal links by default for embedded apps", () => {
    render(<Footer />);

    const impressumLink = screen.getByRole("link", { name: "Impressum" });
    expect(impressumLink).toHaveAttribute("href", `${urls.home}/impressum`);
    expect(impressumLink).toHaveAttribute("target", "_blank");
    expect(impressumLink).toHaveAttribute("rel", "noopener noreferrer");

    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`
    );
  });

  it("supports relative legal links when external is false", () => {
    render(<Footer external={false} />);

    const privacyLinks = screen.getAllByRole("link", { name: "Privacy" });
    expect(privacyLinks.length).toBeGreaterThanOrEqual(2);
    for (const privacyLink of privacyLinks) {
      expect(privacyLink).toHaveAttribute("href", "/privacy");
      expect(privacyLink).not.toHaveAttribute("target");
    }
  });
});
