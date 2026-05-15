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
import {
  assertCustomerCopyStyle,
  assertNonE2eeMarketingCopy,
} from "./test-utils/customer-copy-test-helpers";

describe("app-navbar-about", () => {
  const e2eeAbout = [
    ["tasks", TASKS_NAVBAR_ABOUT],
    ["contacts", CONTACTS_NAVBAR_ABOUT],
    ["notes", NOTES_NAVBAR_ABOUT],
  ] as const;

  const nonE2eeAbout = [
    ["web", WEB_NAVBAR_ABOUT],
    ["store", STORE_NAVBAR_ABOUT],
    ["auth", AUTH_NAVBAR_ABOUT],
    ["pdf", pdfNavbarAbout()],
    ["image-upscaler", imageUpscalerNavbarAbout()],
  ] as const;

  it.each(e2eeAbout)("%s about uses device encryption wording", (_id, text) => {
    assertCustomerCopyStyle(_id, text);
    expect(text).toMatch(/encrypted on your device before storage/i);
    expect(text).toContain(HELVETY_NAVBAR_SWISS_CLOSING);
    expect(text).not.toContain("Designed and built in Switzerland");
  });

  it.each(nonE2eeAbout)(
    "%s about does not claim end-to-end encryption",
    (_id, text) => {
      assertNonE2eeMarketingCopy(_id, text);
    }
  );

  it("E2EE encryption tooltip matches style rules", () => {
    assertCustomerCopyStyle("tooltip", E2EE_NAVBAR_ENCRYPTION_TOOLTIP);
    expect(E2EE_NAVBAR_ENCRYPTION_TOOLTIP).toMatch(
      /encrypted on your device before storage/i
    );
  });
});
