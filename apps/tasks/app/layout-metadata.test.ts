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
});
