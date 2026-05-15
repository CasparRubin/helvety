import {
  assertLicenseFreeSeoCopy,
  assertNoEmDashInCustomerCopy,
  assertSwissOriginInSeoCopy,
} from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Public_Sans: () => ({
    variable: "--font-public-sans",
  }),
}));

vi.mock("@helvety/shared/cached-server", () => ({
  getCachedCSRFToken: vi.fn().mockResolvedValue(""),
  getCachedUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: { logUnexpectedError: vi.fn() },
}));

import { metadata, TASKS_APP_DESCRIPTION } from "./layout";

describe("tasks root layout metadata", () => {
  it("keeps description aligned across metadata, Open Graph, and Twitter", () => {
    expect(metadata.description).toBe(TASKS_APP_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(TASKS_APP_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(TASKS_APP_DESCRIPTION);
  });

  it("disables indexing for the E2EE tasks zone", () => {
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  it("uses stage-based wording in SEO copy, not legacy kanban labels", () => {
    expect(TASKS_APP_DESCRIPTION.toLowerCase()).toContain("stage-based");
    expect(TASKS_APP_DESCRIPTION.toLowerCase()).not.toContain("kanban");
    const defaultTitle =
      typeof metadata.title === "object" &&
      metadata.title !== null &&
      "default" in metadata.title
        ? metadata.title.default
        : metadata.title;
    expect(String(defaultTitle).toLowerCase()).not.toContain("kanban");
    expect(String(defaultTitle).toLowerCase()).toContain("stage-based");
  });

  it("uses license-free encrypted tasks SEO copy", () => {
    assertLicenseFreeSeoCopy("TASKS_APP_DESCRIPTION", TASKS_APP_DESCRIPTION);
    assertSwissOriginInSeoCopy("TASKS_APP_DESCRIPTION", TASKS_APP_DESCRIPTION);
    expect(TASKS_APP_DESCRIPTION).toMatch(/encrypted/i);
  });

  it("SEO copy contains no em-dash", () => {
    assertNoEmDashInCustomerCopy(
      "TASKS_APP_DESCRIPTION",
      TASKS_APP_DESCRIPTION
    );
  });
});
