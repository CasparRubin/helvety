import { expect } from "vitest";

import { nonE2eeCopyClaimsEndToEnd } from "../app-navbar-about";
import {
  CUSTOMER_COPY_EM_DASH,
  findBannedCustomerCopySubstring,
} from "../customer-copy-guardrails";

/**
 * Vitest helper: customer copy must not use em-dashes or banned legacy phrases.
 */
export function assertCustomerCopyStyle(label: string, text: string): void {
  expect(text, `${label} em-dash`).not.toContain(CUSTOMER_COPY_EM_DASH);
  expect(
    findBannedCustomerCopySubstring(text),
    `${label} banned phrase`
  ).toBeUndefined();
}

/**
 * Vitest helper: non-E2EE marketing copy must not claim end-to-end encryption.
 */
export function assertNonE2eeMarketingCopy(label: string, text: string): void {
  assertCustomerCopyStyle(label, text);
  expect(nonE2eeCopyClaimsEndToEnd(text), `${label} E2EE claim`).toBe(false);
}
