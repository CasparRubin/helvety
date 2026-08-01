import { urls } from "@helvety/shared/config";
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

    expect(screen.getByText(/Helvety/).textContent).toContain(
      "© 2026\u00A0Helvety"
    );
  });

  it("keeps the three legal links in one wrap unit separate from copyright", () => {
    render(<Footer />);

    const impressum = screen.getByRole("link", { name: "Impressum" });
    const privacy = screen.getByRole("link", { name: "Privacy" });
    const terms = screen.getByRole("link", { name: "Terms" });
    const copyright = screen.getByText(/Helvety/);

    expect(impressum.parentElement?.parentElement).toBe(
      privacy.parentElement?.parentElement
    );
    expect(privacy.parentElement?.parentElement).toBe(
      terms.parentElement?.parentElement
    );
    expect(copyright.parentElement).not.toBe(
      impressum.parentElement?.parentElement
    );
  });

  it("renders absolute legal links by default for embedded apps", () => {
    render(<Footer />);

    for (const [name, path] of [
      ["Impressum", "/impressum"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ] as const) {
      const legalLink = screen.getByRole("link", { name });
      expect(legalLink).toHaveAttribute("href", `${urls.home}${path}`);
      expect(legalLink).toHaveAttribute("target", "_blank");
      expect(legalLink).toHaveAttribute("rel", "noopener noreferrer");
    }

    expect(
      screen.queryByRole("link", { name: "Abuse" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /@helvety\.com/i })
    ).not.toBeInTheDocument();
  });

  it("supports relative legal links when external is false", () => {
    render(<Footer external={false} />);

    const privacyLink = screen.getByRole("link", { name: "Privacy" });
    expect(privacyLink).toHaveAttribute("href", "/privacy");
    expect(privacyLink).not.toHaveAttribute("target");
  });
});
