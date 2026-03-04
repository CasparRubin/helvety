import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    appendQueryParam: vi.fn(
      (url: string) => `${url}?session_id={CHECKOUT_SESSION_ID}`
    ),
    checkRateLimit: vi.fn(),
    createScopedAdminQuery: vi.fn(),
    createServerClient: vi.fn(),
    createStripeIdempotencyKey: vi.fn(() => "idem-key"),
    getProductFromPriceId: vi.fn(),
    getTrustedClientIp: vi.fn(),
    getStripePriceId: vi.fn(),
    isValidRelativePath: vi.fn(() => true),
    loggerError: vi.fn(),
    loggerInfo: vi.fn(),
    loggerWarn: vi.fn(),
    stripeSessionCreate: vi.fn(),
    validateCSRFToken: vi.fn(),
  };
});

vi.mock("@helvety/shared/client-ip", () => ({
  getTrustedClientIp: mocks.getTrustedClientIp,
}));

vi.mock("@helvety/shared/config", () => ({
  urls: { store: "https://store.helvety.com/store" },
}));

vi.mock("@helvety/shared/csrf", () => ({
  validateCSRFToken: mocks.validateCSRFToken,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: mocks.loggerError,
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
  },
}));

vi.mock("@helvety/shared/redirect-validation", () => ({
  isValidRelativePath: mocks.isValidRelativePath,
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  createScopedAdminQuery: mocks.createScopedAdminQuery,
}));

vi.mock("@helvety/shared/supabase/server", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    CHECKOUT: { maxRequests: 10, windowMs: 60_000 },
  },
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/stripe/idempotency", () => ({
  createStripeIdempotencyKey: mocks.createStripeIdempotencyKey,
}));

vi.mock("@/lib/stripe/url-utils", () => ({
  appendQueryParam: mocks.appendQueryParam,
}));

vi.mock("@/lib/stripe", () => ({
  CHECKOUT_CONFIG: {
    cancelUrl: "/products/{slug}?checkout=canceled",
    consentVersion: "2026-03-03",
    successUrl: "/products/{slug}?checkout=success",
  },
  getProductFromPriceId: mocks.getProductFromPriceId,
  getStripePriceId: mocks.getStripePriceId,
  stripe: {
    checkout: {
      sessions: {
        create: mocks.stripeSessionCreate,
      },
    },
  },
}));

import { POST } from "./route";

/** Creates a minimal checkout POST request with default headers. */
function createCheckoutRequest(
  body: Record<string, unknown>,
  headers?: HeadersInit
): Request {
  return new Request("https://store.helvety.com/store/api/checkout", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": "csrf-token",
      ...headers,
    },
    method: "POST",
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getTrustedClientIp.mockReturnValue("203.0.113.10");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.validateCSRFToken.mockResolvedValue(true);
    mocks.getStripePriceId.mockReturnValue("price_test");
    mocks.getProductFromPriceId.mockReturnValue({
      name: "Helvety SPO Explorer Solo",
      productId: "helvety-spo-explorer",
      tierId: "helvety-spo-explorer-solo-monthly",
      type: "subscription",
    });
    mocks.createServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });
    mocks.stripeSessionCreate.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });
  });

  it("rejects requests when IP cannot be determined", async () => {
    mocks.getTrustedClientIp.mockReturnValue(null);

    const response = await POST(
      createCheckoutRequest({
        tierId: "helvety-spo-explorer-solo-monthly",
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to determine client IP",
    });
  });

  it("rejects requests when rate limit is exceeded", async () => {
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, retryAfter: 42 });

    const response = await POST(
      createCheckoutRequest({
        consentGiven: true,
        tierId: "helvety-spo-explorer-solo-monthly",
      }) as never
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Too many attempts. Please wait 42 seconds before trying again.",
    });
  });

  it("rejects requests with invalid CSRF token", async () => {
    mocks.validateCSRFToken.mockResolvedValue(false);

    const response = await POST(
      createCheckoutRequest({
        consentGiven: true,
        tierId: "helvety-spo-explorer-solo-monthly",
      }) as never
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Security validation failed. Please refresh and try again.",
    });
  });

  it("rejects unknown tiers before creating Stripe sessions", async () => {
    mocks.getStripePriceId.mockReturnValue(undefined);

    const response = await POST(
      createCheckoutRequest({
        consentGiven: true,
        tierId: "unknown-tier",
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid tier ID or tier not configured for payments",
    });
    expect(mocks.stripeSessionCreate).not.toHaveBeenCalled();
  });

  it("requires consent before starting checkout", async () => {
    const response = await POST(
      createCheckoutRequest({
        consentGiven: false,
        tierId: "helvety-spo-explorer-solo-monthly",
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "You must accept the Terms and Privacy Policy to continue.",
    });
    expect(mocks.stripeSessionCreate).not.toHaveBeenCalled();
  });

  it("maps Stripe rate-limit failures to a safe user message", async () => {
    mocks.stripeSessionCreate.mockRejectedValue(
      new Stripe.errors.StripeRateLimitError({
        message: "Rate limited",
        type: "rate_limit_error",
      })
    );

    const response = await POST(
      createCheckoutRequest({
        consentGiven: true,
        tierId: "helvety-spo-explorer-solo-monthly",
      }) as never
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Too many payment attempts. Please wait a moment and try again.",
    });
  });
});
