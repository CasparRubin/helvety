import { describe, expect, it } from "vitest";

import { formatDateTime, TIMEZONE } from "./dates";

describe("TIMEZONE", () => {
  it("is Europe/Zurich", () => {
    expect(TIMEZONE).toBe("Europe/Zurich");
  });
});

describe("formatDateTime", () => {
  it("formats an ISO date string to Swiss format", () => {
    // 2026-02-07T13:30:00Z = 14:30 in Europe/Zurich (UTC+1 in winter)
    const result = formatDateTime("2026-02-07T13:30:00Z");
    expect(result).toContain("07.02.2026");
    expect(result).toContain("14:30");
  });

  it("does not contain a comma (stripped by implementation)", () => {
    const result = formatDateTime("2026-02-07T13:30:00Z");
    expect(result).not.toContain(",");
  });

  it("handles summer time (CEST, UTC+2)", () => {
    // 2026-07-15T12:00:00Z = 14:00 in Europe/Zurich (UTC+2 in summer)
    const result = formatDateTime("2026-07-15T12:00:00Z");
    expect(result).toContain("15.07.2026");
    expect(result).toContain("14:00");
  });

  it("handles leap year dates", () => {
    const result = formatDateTime("2024-02-29T12:00:00Z");
    expect(result).toContain("29.02.2024");
    expect(result).toContain("13:00"); // UTC+1 in winter
  });

  it("handles year boundary (UTC midnight crossing into next day in CET)", () => {
    // 2025-12-31T23:59:59Z = 2026-01-01 00:59 in CET (UTC+1)
    const result = formatDateTime("2025-12-31T23:59:59Z");
    expect(result).toContain("01.01.2026");
    expect(result).toContain("00:59");
  });

  it("handles UTC midnight", () => {
    // 2026-01-15T00:00:00Z = 01:00 in CET (UTC+1)
    const result = formatDateTime("2026-01-15T00:00:00Z");
    expect(result).toContain("15.01.2026");
    expect(result).toContain("01:00");
  });
});
