import { describe, expect, it } from "vitest";

import * as contactEncryption from "./contact-encryption";

describe("contacts contact-encryption module surface", () => {
  it("does not expose legacy category helpers", () => {
    expect("encryptCategoryConfigInput" in contactEncryption).toBe(false);
    expect("decryptCategoryConfigRow" in contactEncryption).toBe(false);
    expect("encryptCategoryInput" in contactEncryption).toBe(false);
    expect("decryptCategoryRow" in contactEncryption).toBe(false);
  });
});
