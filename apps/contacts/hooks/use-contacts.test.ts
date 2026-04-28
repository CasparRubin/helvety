import { describe, expect, it } from "vitest";

import { getContactsApiPath } from "./use-contacts";

describe("getContactsApiPath", () => {
  it("prefixes contact API routes with the contacts base path", () => {
    expect(getContactsApiPath("/api/contacts")).toBe("/contacts/api/contacts");
    expect(getContactsApiPath("/api/contacts/abc-123")).toBe(
      "/contacts/api/contacts/abc-123"
    );
  });
});
