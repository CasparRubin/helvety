import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const loggerMocks = vi.hoisted(() => ({
  warn: vi.fn(),
  logUnexpectedError: vi.fn(),
}));

vi.mock("./logger", () => ({
  logger: {
    warn: loggerMocks.warn,
    logUnexpectedError: loggerMocks.logUnexpectedError,
  },
}));

import {
  parseActionInput,
  unexpectedActionError,
} from "./server-action-primitives";

describe("server-action-primitives", () => {
  it("returns parsed payload when validation succeeds", () => {
    const schema = z.object({ id: z.string().uuid() });
    const data = { id: "550e8400-e29b-41d4-a716-446655440000" };

    const result = parseActionInput({
      schema,
      data,
      invalidDataMessage: "Invalid input",
      warnMessage: "Invalid payload",
    });

    expect(result).toEqual({ success: true, data });
    expect(loggerMocks.warn).not.toHaveBeenCalled();
  });

  it("returns failure and logs structured warning when validation fails", () => {
    const schema = z.object({ id: z.string().uuid() });

    const result = parseActionInput({
      schema,
      data: { id: "nope" },
      invalidDataMessage: "Invalid input",
      warnMessage: "Invalid payload",
    });

    expect(result).toEqual({ success: false, error: "Invalid input" });
    expect(loggerMocks.warn).toHaveBeenCalledWith("Invalid payload", {
      fields: ["id"],
      issueCount: 1,
    });
  });

  it("wraps unexpected errors with a generic action response", () => {
    const err = new Error("boom");

    const result = unexpectedActionError("Unexpected error in testAction", err);

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred",
    });
    expect(loggerMocks.logUnexpectedError).toHaveBeenCalledWith(
      "Unexpected error in testAction",
      err
    );
  });
});
