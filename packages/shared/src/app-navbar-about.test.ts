import { describe, expect, it } from "vitest";

import {
  STORE_NAVBAR_ABOUT,
  WEB_NAVBAR_ABOUT,
  imageEditorNavbarAbout,
  ocrNavbarAbout,
  pdfNavbarAbout,
} from "./app-navbar-about";
import { assertNoEmDashInCustomerCopy } from "./test-utils/customer-copy-test-helpers";

describe("app-navbar-about", () => {
  const allAboutDescriptions = [
    ["web", WEB_NAVBAR_ABOUT],
    ["store", STORE_NAVBAR_ABOUT],
    ["pdf", pdfNavbarAbout()],
    ["image-editor", imageEditorNavbarAbout()],
    ["ocr", ocrNavbarAbout()],
  ] as const;

  it.each(allAboutDescriptions)("%s contains no em-dash", (_id, text) => {
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
});
