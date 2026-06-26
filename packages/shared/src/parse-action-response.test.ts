import { describe, expect, it } from "vitest";

import {
  isActionResponsePayload,
  parseActionResponse,
} from "./parse-action-response";

describe("isActionResponsePayload", () => {
  it("accepts objects with a boolean success field", () => {
    expect(isActionResponsePayload({ success: true })).toBe(true);
    expect(isActionResponsePayload({ success: false, error: "x" })).toBe(true);
  });

  it("rejects non-objects and shapes without a boolean success", () => {
    expect(isActionResponsePayload(null)).toBe(false);
    expect(isActionResponsePayload("success")).toBe(false);
    expect(isActionResponsePayload({})).toBe(false);
    expect(isActionResponsePayload({ success: "yes" })).toBe(false);
  });
});

describe("parseActionResponse", () => {
  it("returns the parsed payload for an ok response", async () => {
    const response = new Response(JSON.stringify({ success: true, data: 42 }), {
      status: 200,
    });
    const result = await parseActionResponse<number>(response, "fallback");
    expect(result).toEqual({ success: true, data: 42 });
  });

  it("falls back when an ok response is not ActionResponse-shaped", async () => {
    const response = new Response(JSON.stringify({ unexpected: true }), {
      status: 200,
    });
    expect(await parseActionResponse(response, "fallback")).toEqual({
      success: false,
      error: "fallback",
    });
  });

  it("falls back when an ok response body is empty", async () => {
    const response = new Response("", { status: 200 });
    expect(await parseActionResponse(response, "fallback")).toEqual({
      success: false,
      error: "fallback",
    });
  });

  it("uses the server error string for a failed response", async () => {
    const response = new Response(JSON.stringify({ error: "nope" }), {
      status: 400,
    });
    expect(await parseActionResponse(response, "fallback")).toEqual({
      success: false,
      error: "nope",
    });
  });

  it("appends the status when a failed response has no error string", async () => {
    const response = new Response("not json", { status: 500 });
    expect(await parseActionResponse(response, "fallback")).toEqual({
      success: false,
      error: "fallback (status 500)",
    });
  });
});
