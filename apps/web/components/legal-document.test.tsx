import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import {
  LegalPageShell,
  LegalTable,
  LegalTableWrap,
  LegalToc,
} from "./legal-document";

describe("legal-document", () => {
  it("keeps the table scroll region keyboard-accessible", () => {
    render(
      <LegalTableWrap ariaLabel="Cookie providers">
        <span>table</span>
      </LegalTableWrap>
    );

    const region = screen.getByRole("region", { name: "Cookie providers" });
    expect(region).toHaveAttribute("tabIndex", "0");
    expect(region.className).toContain("legal-table-wrap");
  });

  it("applies scroll and card layout classes", () => {
    const { rerender } = render(
      <LegalTable layout="scroll">
        <span>rows</span>
      </LegalTable>
    );
    expect(screen.getByText("rows").parentElement?.className).toContain(
      "legal-table-scroll"
    );

    rerender(
      <LegalTable layout="cards">
        <span>rows</span>
      </LegalTable>
    );
    expect(screen.getByText("rows").parentElement?.className).toContain(
      "legal-table-cards"
    );
  });

  it("exposes a named table of contents landmark", () => {
    render(
      <LegalToc>
        <a href="#section">Section</a>
      </LegalToc>
    );
    expect(
      screen.getByRole("navigation", { name: "Table of contents" })
    ).toBeInTheDocument();
  });

  it("renders the shared legal page shell with a back link", () => {
    render(
      <LegalPageShell backHref="/legal" backLabel="Back to Legal">
        <p>Body</p>
      </LegalPageShell>
    );

    expect(
      screen.getByRole("button", { name: /Back to Legal/i })
    ).toHaveAttribute("href", "/legal");
    expect(screen.getByText("Body")).toBeInTheDocument();
  });
});
