import { describe, expect, it } from "vitest";

import { DATA_RETENTION } from "./data-retention";

describe("data retention policy defaults", () => {
  it("pins attachment audit metadata to six months", () => {
    expect(DATA_RETENTION.ATTACHMENT_AUDIT_LOG_RETENTION_DAYS).toBe(183);
  });

  it("uses ten-year windows for legal evidence records", () => {
    expect(DATA_RETENTION.CONTRACT_EVIDENCE_RETENTION_YEARS).toBe(10);
    expect(DATA_RETENTION.TRANSACTION_EVIDENCE_RETENTION_YEARS).toBe(10);
  });
});
