import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { StoreProductsSpeculationClient } from "./store-products-speculation-client";

const MARKER = "data-helvety-store-products-speculation";
const rulesJson = JSON.stringify({
  prefetch: [{ source: "list", urls: ["/store/products"] }],
});

describe("StoreProductsSpeculationClient", () => {
  beforeEach(() => {
    document
      .querySelectorAll(`script[type="speculationrules"][${MARKER}]`)
      .forEach((node) => node.remove());
  });

  it("injects a nonced speculationrules script into the document", async () => {
    render(
      <StoreProductsSpeculationClient rulesJson={rulesJson} nonce="dom-nonce" />
    );

    await waitFor(() => {
      const script = document.querySelector(
        `script[type="speculationrules"][${MARKER}]`
      );
      expect(script).toBeInstanceOf(HTMLScriptElement);
      expect(script?.textContent).toContain("/store/products");
      expect((script as HTMLScriptElement).nonce).toBe("dom-nonce");
    });
  });

  it("does not duplicate when a marked script already exists", async () => {
    const existing = document.createElement("script");
    existing.type = "speculationrules";
    existing.setAttribute(MARKER, "");
    existing.textContent = '{"prefetch":[]}';
    document.head.append(existing);

    render(
      <StoreProductsSpeculationClient
        rulesJson={rulesJson}
        nonce="test-nonce"
      />
    );

    await waitFor(() => {
      expect(
        document.querySelectorAll(`script[type="speculationrules"][${MARKER}]`)
      ).toHaveLength(1);
    });
    expect(
      document.querySelector(`script[type="speculationrules"][${MARKER}]`)
        ?.textContent
    ).toBe('{"prefetch":[]}');
  });
});
