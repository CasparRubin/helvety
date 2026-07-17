import { describe, expect, it } from "vitest";

import {
  AUTH_NAVBAR_ABOUT,
  AUTH_NAVBAR_ENCRYPTION_TOOLTIP,
  CONTACTS_NAVBAR_ABOUT,
  E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  LINKS_NAVBAR_ABOUT,
  NOTES_NAVBAR_ABOUT,
  STORE_NAVBAR_ABOUT,
  TASKS_NAVBAR_ABOUT,
  WEB_NAVBAR_ABOUT,
  imageUpscalerNavbarAbout,
  imageEditorNavbarAbout,
  ocrNavbarAbout,
  pdfNavbarAbout,
} from "./app-navbar-about";
import { assertNoEmDashInCustomerCopy } from "./test-utils/customer-copy-test-helpers";

describe("app-navbar-about", () => {
  const allAboutDescriptions = [
    ["web", WEB_NAVBAR_ABOUT],
    ["store", STORE_NAVBAR_ABOUT],
    ["auth", AUTH_NAVBAR_ABOUT],
    ["tasks", TASKS_NAVBAR_ABOUT],
    ["contacts", CONTACTS_NAVBAR_ABOUT],
    ["links", LINKS_NAVBAR_ABOUT],
    ["notes", NOTES_NAVBAR_ABOUT],
    ["pdf", pdfNavbarAbout()],
    ["image-upscaler", imageUpscalerNavbarAbout()],
    ["image-editor", imageEditorNavbarAbout()],
    ["ocr", ocrNavbarAbout()],
  ] as const;
  const allCustomerCopy = [
    ...allAboutDescriptions,
    ["encryption-tooltip", E2EE_NAVBAR_ENCRYPTION_TOOLTIP],
    ["auth-encryption-tooltip", AUTH_NAVBAR_ENCRYPTION_TOOLTIP],
  ] as const;

  it.each(allCustomerCopy)("%s contains no em-dash", (_id, text) => {
    assertNoEmDashInCustomerCopy(_id, text);
  });

  it.each(allAboutDescriptions)(
    "%s excludes the shared developer, Swiss-origin, and build section",
    (_id, text) => {
      expect(text).not.toMatch(
        /Helvety software by|Switzerland|Swiss|version information|build information/i
      );
    }
  );

  it("keeps E2EE About copy app-specific without developer attribution", () => {
    for (const text of [
      TASKS_NAVBAR_ABOUT,
      CONTACTS_NAVBAR_ABOUT,
      LINKS_NAVBAR_ABOUT,
      NOTES_NAVBAR_ABOUT,
    ]) {
      expect(text).toMatch(/encrypted on your device before storage/i);
      expect(text).not.toMatch(/Switzerland|Helvety software by/i);
    }
  });

  it.each([
    ["E2EE apps", E2EE_NAVBAR_ENCRYPTION_TOOLTIP],
    ["Auth", AUTH_NAVBAR_ENCRYPTION_TOOLTIP],
  ])(
    "%s discloses unencrypted identifiers and structural metadata",
    (_id, text) => {
      expect(text).toMatch(/record identifiers/i);
      expect(text).toMatch(/timestamps/i);
      expect(text).toMatch(/sort order/i);
      expect(text).toMatch(/cross-app relationship identifiers/i);
    }
  );
});
