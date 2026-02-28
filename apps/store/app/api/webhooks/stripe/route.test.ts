import { describe, expect, it } from "vitest";

import {
  HANDLED_WEBHOOK_EVENTS,
  isHandledWebhookEvent,
} from "@/lib/stripe/config";

describe("webhook event handling policy", () => {
  it("accepts every configured handled event", () => {
    for (const eventType of HANDLED_WEBHOOK_EVENTS) {
      expect(isHandledWebhookEvent(eventType)).toBe(true);
    }
  });

  it("rejects unknown webhook events", () => {
    expect(isHandledWebhookEvent("customer.created")).toBe(false);
    expect(isHandledWebhookEvent("invoice.finalized")).toBe(false);
  });
});
