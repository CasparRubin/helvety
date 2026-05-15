import { describe, expect, it } from "vitest";

import {
  AUTH_NAVBAR_ABOUT,
  CONTACTS_NAVBAR_ABOUT,
  E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  HELVETY_NAVBAR_SWISS_CLOSING,
  NOTES_NAVBAR_ABOUT,
  STORE_NAVBAR_ABOUT,
  TASKS_NAVBAR_ABOUT,
  WEB_NAVBAR_ABOUT,
  imageUpscalerNavbarAbout,
  pdfNavbarAbout,
} from "./app-navbar-about";
import { assertNoEmDashInCustomerCopy } from "./test-utils/customer-copy-test-helpers";

describe("app-navbar-about", () => {
  const allAbout = [
    ["web", WEB_NAVBAR_ABOUT],
    ["store", STORE_NAVBAR_ABOUT],
    ["auth", AUTH_NAVBAR_ABOUT],
    ["tasks", TASKS_NAVBAR_ABOUT],
    ["contacts", CONTACTS_NAVBAR_ABOUT],
    ["notes", NOTES_NAVBAR_ABOUT],
    ["pdf", pdfNavbarAbout()],
    ["image-upscaler", imageUpscalerNavbarAbout()],
    ["encryption-tooltip", E2EE_NAVBAR_ENCRYPTION_TOOLTIP],
  ] as const;

  it.each(allAbout)("%s contains no em-dash", (_id, text) => {
    assertNoEmDashInCustomerCopy(_id, text);
  });

  it("E2EE about copy uses device encryption and Swiss closing", () => {
    for (const text of [
      TASKS_NAVBAR_ABOUT,
      CONTACTS_NAVBAR_ABOUT,
      NOTES_NAVBAR_ABOUT,
    ]) {
      expect(text).toMatch(/encrypted on your device before storage/i);
      expect(text).toContain(HELVETY_NAVBAR_SWISS_CLOSING);
    }
  });
});
