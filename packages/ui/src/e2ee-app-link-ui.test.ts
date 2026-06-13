import { describe, expect, it } from "vitest";

import { E2EE_APP_LINK_UI } from "./e2ee-app-link-ui";

describe("E2EE_APP_LINK_UI", () => {
  it("uses plain app names for section titles", () => {
    expect(E2EE_APP_LINK_UI.notes.sectionTitle).toBe("Notes");
    expect(E2EE_APP_LINK_UI.tasks.sectionTitle).toBe("Tasks");
    expect(E2EE_APP_LINK_UI.contacts.sectionTitle).toBe("Contacts");
    expect(E2EE_APP_LINK_UI.links.sectionTitle).toBe("Links");
  });

  it("uses the same icon for section headers and picker rows", () => {
    for (const config of Object.values(E2EE_APP_LINK_UI)) {
      expect(config.sectionIcon).toBe(config.pickerItemIcon);
    }
  });
});
