import { expect } from "vitest";

/** Asserts blocking theme init runs in `<head>` before `<body>`. */
export function expectThemeScriptInHead(html: string): void {
  const headEnd = html.indexOf("</head>");
  const bodyStart = html.indexOf("<body");
  const scriptIndex = html.indexOf("localStorage.getItem");
  expect(headEnd).toBeGreaterThan(-1);
  expect(bodyStart).toBeGreaterThan(headEnd);
  expect(scriptIndex).toBeGreaterThan(-1);
  expect(scriptIndex).toBeLessThan(headEnd);
}

/** Theme script must not run after the skip link (legacy body placement). */
export function expectThemeScriptBeforeSkipLink(html: string): void {
  const skipIndex = html.indexOf("Skip to main content");
  const scriptIndex = html.indexOf("localStorage.getItem");
  expect(skipIndex).toBeGreaterThan(-1);
  expect(scriptIndex).toBeGreaterThan(-1);
  expect(scriptIndex).toBeLessThan(skipIndex);
}
