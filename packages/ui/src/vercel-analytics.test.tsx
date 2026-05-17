import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("isHelvetyVercelAnalyticsEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is enabled by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS", undefined);
    const { isHelvetyVercelAnalyticsEnabled } =
      await import("./vercel-analytics");
    expect(isHelvetyVercelAnalyticsEnabled()).toBe(true);
  });

  it("is disabled when NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS is false", async () => {
    vi.stubEnv("NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS", "false");
    const { isHelvetyVercelAnalyticsEnabled } =
      await import("./vercel-analytics");
    expect(isHelvetyVercelAnalyticsEnabled()).toBe(false);
  });
});

describe("HelvetyVercelAnalytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock("@vercel/analytics/next");
    vi.doUnmock("@vercel/speed-insights/next");
  });

  it("renders nothing when analytics is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS", "false");
    const { HelvetyVercelAnalytics, HelvetyVercelAnalyticsWithSpeedInsights } =
      await import("./vercel-analytics");

    expect(renderToStaticMarkup(<HelvetyVercelAnalytics />)).toBe("");
    expect(
      renderToStaticMarkup(<HelvetyVercelAnalyticsWithSpeedInsights />)
    ).toBe("");
  });

  it("mounts Vercel Analytics when enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS", undefined);
    vi.doMock("@vercel/analytics/next", () => ({
      Analytics: () => <div data-testid="vercel-analytics-stub" />,
    }));
    vi.doMock("@vercel/speed-insights/next", () => ({
      SpeedInsights: () => <div data-testid="vercel-speed-insights-stub" />,
    }));

    const { HelvetyVercelAnalytics, HelvetyVercelAnalyticsWithSpeedInsights } =
      await import("./vercel-analytics");

    expect(renderToStaticMarkup(<HelvetyVercelAnalytics />)).toContain(
      'data-testid="vercel-analytics-stub"'
    );
    const withSpeed = renderToStaticMarkup(
      <HelvetyVercelAnalyticsWithSpeedInsights />
    );
    expect(withSpeed).toContain('data-testid="vercel-analytics-stub"');
    expect(withSpeed).toContain('data-testid="vercel-speed-insights-stub"');
  });
});
