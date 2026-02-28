import { describe, expect, it } from "vitest";

import { ATTACHMENT_AUDIT_EVENT_TYPES } from "./attachment-logger";

describe("attachment audit event coverage", () => {
  it("includes upload, download, and deletion events", () => {
    expect(ATTACHMENT_AUDIT_EVENT_TYPES).toContain("attachment_upload_success");
    expect(ATTACHMENT_AUDIT_EVENT_TYPES).toContain("attachment_download");
    expect(ATTACHMENT_AUDIT_EVENT_TYPES).toContain("attachment_deleted");
  });
});
