import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LegalTable, LegalTableWrap } from "./legal-document";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("LegalTableWrap", () => {
  it("renders an accessible scroll region", () => {
    render(
      <LegalTableWrap ariaLabel="Provider list">
        <p>Table content</p>
      </LegalTableWrap>
    );

    const region = screen.getByRole("region", { name: "Provider list" });
    expect(region).toHaveClass("legal-table-wrap");
    expect(region).toHaveAttribute("tabindex", "0");
  });
});

describe("LegalTable", () => {
  it("applies scroll layout class for provider tables", () => {
    const { container } = render(
      <LegalTable layout="scroll">
        <table />
      </LegalTable>
    );

    expect(container.firstElementChild).toHaveClass("legal-table-scroll");
  });

  it("applies card layout class for wide tables", () => {
    const { container } = render(
      <LegalTable layout="cards">
        <table />
      </LegalTable>
    );

    expect(container.firstElementChild).toHaveClass("legal-table-cards");
  });
});

describe("LegalPageShell", () => {
  it("server-renders the shared legal section shell", () => {
    const src = readFileSync(
      join(webRoot, "components/legal-document.tsx"),
      "utf8"
    );
    expect(src).toContain("LegalPageShell");
    expect(src).toContain("LegalTableWrap");
  });
});
