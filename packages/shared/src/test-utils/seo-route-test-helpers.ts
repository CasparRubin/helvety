import { expect } from "vitest";

import { AI_DISCOVERY_USER_AGENTS } from "../seo";

import type { MetadataRoute } from "next";

/** Single robots.txt rule entry for test helpers. */
type RobotsRule = {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
  crawlDelay?: number;
};

/** Normalizes Next.js robots output to a rule array. */
export function normalizeRobotsRules(
  robotsOutput: MetadataRoute.Robots
): RobotsRule[] {
  const rules = robotsOutput.rules;
  if (!rules) return [];
  return Array.isArray(rules) ? rules : [rules];
}

/**
 * Asserts public-zone robots: `*` and {@link AI_DISCOVERY_USER_AGENTS} share the
 * same allow/disallow policy (see `buildPublicCrawlerRules` in `@helvety/shared/seo`).
 */
export function expectPublicCrawlerRobots(
  robotsOutput: MetadataRoute.Robots,
  options: Readonly<{
    disallowPaths: readonly string[];
    mustNotDisallow?: readonly string[];
    sitemap?: string;
  }>
): void {
  const rules = normalizeRobotsRules(robotsOutput);

  expect(rules.map((rule) => rule.userAgent)).toEqual(
    expect.arrayContaining(["*", ...AI_DISCOVERY_USER_AGENTS])
  );

  for (const rule of rules) {
    expect(rule.allow).toBe("/");
    const disallow = rule.disallow;
    const disallowPaths = Array.isArray(disallow)
      ? disallow
      : disallow
        ? [disallow]
        : [];
    expect(disallowPaths).toEqual(
      expect.arrayContaining([...options.disallowPaths])
    );
    for (const path of options.mustNotDisallow ?? []) {
      expect(disallowPaths).not.toContain(path);
    }
  }

  if (options.sitemap !== undefined) {
    expect(robotsOutput.sitemap).toBe(options.sitemap);
  }
}
