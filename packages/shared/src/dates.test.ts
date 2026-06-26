import { describe, expect, it } from "vitest";

import { formatDateTime } from "./dates";

describe("formatDateTime", () => {
  it("formats an ISO string as dd.MM.yyyy HH:mm without a comma", () => {
    const result = formatDateTime("2026-02-07T13:30:00.000Z");
    expect(result).toBe("07.02.2026 14:30");
    expect(result).not.toContain(",");
  });

  it("applies the Europe/Zurich winter offset (CET, UTC+1)", () => {
    expect(formatDateTime("2026-02-07T23:30:00.000Z")).toBe("08.02.2026 00:30");
  });

  it("applies the Europe/Zurich summer offset (CEST, UTC+2)", () => {
    expect(formatDateTime("2026-07-07T12:30:00.000Z")).toBe("07.07.2026 14:30");
  });

  it("always returns the dd.MM.yyyy HH:mm shape", () => {
    expect(formatDateTime("2026-12-31T22:05:00.000Z")).toMatch(
      /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/
    );
  });
});
