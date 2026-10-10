import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JsonLdScript } from "./json-ld-script";

describe("JsonLdScript", () => {
  it("renders JSON-LD script content", () => {
    render(<JsonLdScript json={{ "@context": "https://schema.org" }} />);

    const script = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]'
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@context":"https://schema.org"');
    expect(script).not.toHaveAttribute("nonce");
  });
});
