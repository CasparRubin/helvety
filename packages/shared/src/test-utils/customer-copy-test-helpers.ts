import { expect } from "vitest";

import { CUSTOMER_COPY_EM_DASH } from "../customer-copy-guardrails";
import { HELVETY_SOURCE_LICENSE_MARKETING } from "../licensing";

/** Vitest helper: user-facing copy must not contain U+2014 em-dashes. */
export function assertNoEmDashInCustomerCopy(
  label: string,
  text: string
): void {
  expect(text, `${label} em-dash`).not.toContain(CUSTOMER_COPY_EM_DASH);
}

/** SEO / PWA summaries must not market license terms (see `## Licensing` in llms.txt). */
export function assertLicenseFreeSeoCopy(label: string, text: string): void {
  expect(text, `${label} AGPL`).not.toMatch(/AGPL/i);
  expect(text, `${label} open source`).not.toMatch(/open[- ]source/i);
  expect(text, `${label} published-source`).not.toMatch(
    /All published Helvety source/i
  );
  expect(text, `${label} license marketing`).not.toContain(
    HELVETY_SOURCE_LICENSE_MARKETING
  );
}

/** Accepts full Swiss-origin SEO closing or the compact PWA suffix. */
export function assertSwissOriginInSeoCopy(label: string, text: string): void {
  expect(text, `${label} Swiss origin`).toMatch(
    /Engineered, designed and made in Switzerland|Swiss-built\./
  );
}

/** Layout `keywords` must not target license terms. */
export function assertLicenseFreeSeoKeywords(
  label: string,
  keywords: string | readonly string[] | null | undefined
): void {
  const list =
    keywords == null ? [] : Array.isArray(keywords) ? keywords : [keywords];
  expect(list, label).not.toContain("AGPL-3.0");
  expect(list, label).not.toContain("open source");
}
