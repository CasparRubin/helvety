import { describe, expect, it } from "vitest";

import { appendQueryParam } from "./url-utils";

describe("appendQueryParam", () => {
  it("appends with ? when URL has no querystring", () => {
    const result = appendQueryParam(
      "https://helvety.com/store/products/demo",
      "session_id",
      "{CHECKOUT_SESSION_ID}"
    );

    expect(result).toBe(
      "https://helvety.com/store/products/demo?session_id=%7BCHECKOUT_SESSION_ID%7D"
    );
  });

  it("appends with & when URL already has query params", () => {
    const result = appendQueryParam(
      "https://helvety.com/store/products/demo?checkout=success",
      "session_id",
      "{CHECKOUT_SESSION_ID}"
    );

    expect(result).toBe(
      "https://helvety.com/store/products/demo?checkout=success&session_id=%7BCHECKOUT_SESSION_ID%7D"
    );
  });
});
