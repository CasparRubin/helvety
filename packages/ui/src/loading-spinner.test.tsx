import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LoadingSpinner } from "./loading-spinner";

const spinnerSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "loading-spinner.tsx"),
  "utf8"
);

describe("LoadingSpinner", () => {
  it("renders a CSS-only spinner without lucide client icons", () => {
    expect(spinnerSource).not.toContain("lucide-react");
    expect(spinnerSource).not.toContain('"use client"');

    const html = renderToStaticMarkup(<LoadingSpinner />);
    expect(html).toContain("animate-spin");
    expect(html).toContain("rounded-full");
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading...");
  });
});
