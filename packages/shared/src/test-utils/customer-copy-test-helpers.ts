import { expect } from "vitest";

import { CUSTOMER_COPY_EM_DASH } from "../customer-copy-guardrails";

/** Vitest helper: user-facing copy must not contain U+2014 em-dashes. */
export function assertNoEmDashInCustomerCopy(
  label: string,
  text: string
): void {
  expect(text, `${label} em-dash`).not.toContain(CUSTOMER_COPY_EM_DASH);
}

/** @deprecated Use {@link assertNoEmDashInCustomerCopy}. */
export const assertCustomerCopyStyle = assertNoEmDashInCustomerCopy;
