import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONTACT_CATEGORY_ID,
  DEFAULT_NOTE_CATEGORY_ID,
  DEFAULT_TASK_LABEL_ID,
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STAGE_ID,
} from "./e2ee-entity-defaults";
import { PLAINTEXT_CONTENT_FIELD_NAMES } from "./e2ee-write-guard";

describe("e2ee-entity-defaults", () => {
  it("pins structural default IDs used by E2EE creates", () => {
    expect(DEFAULT_CONTACT_CATEGORY_ID).toBe("personal");
    expect(DEFAULT_NOTE_CATEGORY_ID).toBe("personal");
    expect(DEFAULT_TASK_STAGE_ID).toBe("default-item-backlog");
    expect(DEFAULT_TASK_LABEL_ID).toBe("default-item-label");
    expect(DEFAULT_TASK_PRIORITY).toBe(0);
  });

  it("default values are not plaintext content field names", () => {
    const forbidden = new Set<string>(PLAINTEXT_CONTENT_FIELD_NAMES);
    for (const value of [
      DEFAULT_CONTACT_CATEGORY_ID,
      DEFAULT_NOTE_CATEGORY_ID,
      DEFAULT_TASK_STAGE_ID,
      DEFAULT_TASK_LABEL_ID,
    ]) {
      expect(forbidden.has(value)).toBe(false);
    }
  });
});
