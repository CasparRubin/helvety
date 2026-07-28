import "server-only";

/**
 * Rate Limiting Module
 *
 * Provides distributed rate limiting using Upstash Redis for production
 * environments. In production with strict policy, failures are fail-closed
 * (requests rejected) when Redis is unavailable or credentials are missing.
 * Soft policy can allow requests in production during Redis outages. Falls
 * back to in-memory rate limiting only in development.
 *
 * Production: Uses @upstash/ratelimit with sliding window algorithm.
 *   - Works across serverless invocations and multiple instances
 *   - Shared state via Upstash Redis
 *
 * Development: Uses in-memory Map (single-server only).
 *   - Acceptable for local development
 *   - Does not persist across server restarts
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "./logger";

// =============================================================================
// Types
// =============================================================================

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Seconds until the rate limit resets (only if not allowed) */
  retryAfter?: number;
}

/** Rate limit behavior during Redis outages in production. */
export type RateLimitPolicy = "strict" | "soft";
/** Internal outcome classification for rate-limit decisions. */
type RateLimitDecision = "allow" | "deny" | "error";
/** Internal storage key categories used by Redis and fallbacks. */
type RateLimitKeyType = "generic";

/** Structured metric dimensions recorded for rate-limit observability. */
interface RateLimitMetricKey {
  prefix: string;
  policy: RateLimitPolicy;
  decision: RateLimitDecision;
  keyType: RateLimitKeyType;
  environment: string;
}

// =============================================================================
// Upstash Redis Client (singleton)
// =============================================================================

let redis: Redis | null = null;
let hasWarnedMissingRedis = false;
const MAX_METRIC_BUCKETS = 500;
const rateLimitMetrics = new Map<string, number>();

/** Normalize key parts for consistent namespace and comparison behavior. */
function normalizeKeyPart(part: string): string {
  return part.trim().toLowerCase();
}

/** Build canonical storage keys for rate-limit and lockout data. */
function buildRateLimitStorageKey(
  keyType: RateLimitKeyType,
  identifier: string
): string {
  const normalizedIdentifier = normalizeKeyPart(identifier);
  switch (keyType) {
    case "generic":
      return `ratelimit:generic:${normalizedIdentifier}`;
  }
}

/** Record a bounded in-memory metric bucket for rate-limit outcomes. */
function recordRateLimitMetric(metric: RateLimitMetricKey): void {
  const bucket = `${metric.environment}:${metric.prefix}:${metric.policy}:${metric.keyType}:${metric.decision}`;
  const nextValue = (rateLimitMetrics.get(bucket) ?? 0) + 1;
  rateLimitMetrics.set(bucket, nextValue);
  if (rateLimitMetrics.size > MAX_METRIC_BUCKETS) {
    const oldest = rateLimitMetrics.keys().next().value;
    if (oldest) {
      rateLimitMetrics.delete(oldest);
    }
  }
}

/** Log rate-limit outcomes with consistent structured metadata. */
function logRateLimitDecision(
  message: string,
  details: Omit<RateLimitMetricKey, "decision"> & {
    decision: RateLimitDecision;
    reason: string;
    error?: unknown;
  }
): void {
  recordRateLimitMetric({
    prefix: details.prefix,
    policy: details.policy,
    keyType: details.keyType,
    environment: details.environment,
    decision: details.decision,
  });
  const metadata = {
    prefix: details.prefix,
    policy: details.policy,
    keyType: details.keyType,
    environment: details.environment,
    reason: details.reason,
  };
  if (details.error) {
    logger.logUnexpectedError(message, details.error, metadata);
    return;
  }
  if (details.decision === "deny" || details.decision === "error") {
    logger.warn(message, metadata);
    return;
  }
  logger.info(message, metadata);
}

/**
 * Get or create the Upstash Redis client.
 * Returns null if credentials are not configured.
 */
function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production" && !hasWarnedMissingRedis) {
      hasWarnedMissingRedis = true;
      logger.warn(
        "UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN are not configured. " +
          "Rate limiting will fail closed (reject all rate-limited requests) in production with strict policy. " +
          "Configure Upstash Redis for distributed rate limiting: https://console.upstash.com/"
      );
    }
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

// =============================================================================
// Rate Limiter Instances (cached per configuration)
// =============================================================================

const rateLimiters = new Map<string, Ratelimit>();

/**
 * Get or create an Upstash rate limiter for the given configuration.
 */
function getUpstashLimiter(
  prefix: string,
  maxRequests: number,
  windowMs: number
): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;

  const key = `${normalizeKeyPart(prefix)}:${maxRequests}:${windowMs}`;
  let limiter = rateLimiters.get(key);

  if (!limiter) {
    const windowSec = Math.ceil(windowMs / 1000);
    const duration: `${number} m` | `${number} s` =
      windowSec >= 60 ? `${Math.ceil(windowSec / 60)} m` : `${windowSec} s`;

    limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(maxRequests, duration),
      prefix: `ratelimit:${normalizeKeyPart(prefix)}`,
      analytics: process.env.NODE_ENV === "production",
    });

    rateLimiters.set(key, limiter);
  }

  return limiter;
}

// =============================================================================
// In-Memory Fallback (development only)
// =============================================================================

/** In-memory rate limit tracking record (development fallback) */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitRecord>();
const MAX_IN_MEMORY_ENTRIES = 10_000;

const CLEANUP_INTERVAL = 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

/** Start periodic cleanup of expired in-memory records and enforce size cap. */
function startCleanup(): void {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of inMemoryStore.entries()) {
      if (now > record.resetTime) {
        inMemoryStore.delete(key);
      }
    }
    if (inMemoryStore.size > MAX_IN_MEMORY_ENTRIES) {
      const excess = inMemoryStore.size - MAX_IN_MEMORY_ENTRIES;
      const keys = inMemoryStore.keys();
      for (let i = 0; i < excess; i++) {
        const next = keys.next();
        if (!next.done) inMemoryStore.delete(next.value);
      }
    }
  }, CLEANUP_INTERVAL);

  cleanupTimer.unref();
}

/** In-memory rate limit check (fallback for development). */
function checkInMemoryRateLimit(
  key: string,
  prefix: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  startCleanup();

  const namespacedKey = `${normalizeKeyPart(prefix)}:${key}`;
  const now = Date.now();
  const record = inMemoryStore.get(namespacedKey);

  if (!record || now > record.resetTime) {
    inMemoryStore.set(namespacedKey, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if a request is allowed under the rate limit.
 *
 * Uses Upstash Redis in production (distributed). In production with strict
 * policy, requests are rejected if Redis is unavailable or credentials are not
 * configured. With soft policy, requests may be allowed in those failure
 * conditions. In development, falls back to in-memory when credentials are not
 * configured.
 *
 * @param key - Unique identifier for the rate limit (e.g., IP + endpoint)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @param prefix - Redis key prefix for the limiter (default: "api"). Different
 *   prefixes create separate Upstash Ratelimit instances and Redis key namespaces.
 * @param policy - Failure policy in production: "strict" fails closed when Redis
 *   is unavailable; "soft" allows requests during Redis outages.
 * @returns Rate limit result with allowed status and remaining requests
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000,
  prefix: string = "api",
  policy: RateLimitPolicy = "strict"
): Promise<RateLimitResult> {
  const normalizedPrefix = normalizeKeyPart(prefix);
  const environment = process.env.NODE_ENV ?? "unknown";
  const limiter = getUpstashLimiter(normalizedPrefix, maxRequests, windowMs);

  if (limiter) {
    try {
      const result = await limiter.limit(
        buildRateLimitStorageKey("generic", `${normalizedPrefix}:${key}`)
      );

      if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
        logRateLimitDecision("Rate limit denied", {
          prefix: normalizedPrefix,
          policy,
          keyType: "generic",
          environment,
          decision: "deny",
          reason: "upstash_limit_exceeded",
        });
        return {
          allowed: false,
          remaining: result.remaining,
          retryAfter: Math.max(retryAfter, 1),
        };
      }

      logRateLimitDecision("Rate limit allowed", {
        prefix: normalizedPrefix,
        policy,
        keyType: "generic",
        environment,
        decision: "allow",
        reason: "upstash_allow",
      });
      return { allowed: true, remaining: result.remaining };
    } catch (error) {
      // In production with strict policy, fail closed when Redis is unavailable.
      // With soft policy, allow requests during Redis outages.
      // In-memory fallback does not persist across serverless invocations,
      // making it ineffective for distributed rate limiting.
      if (process.env.NODE_ENV === "production" && policy === "strict") {
        logRateLimitDecision(
          "Upstash rate limit failed in production - failing closed",
          {
            prefix: normalizedPrefix,
            policy,
            keyType: "generic",
            environment,
            decision: "error",
            reason: "upstash_failure_strict",
            error,
          }
        );
        return { allowed: false, remaining: 0, retryAfter: 30 };
      }
      if (process.env.NODE_ENV === "production" && policy === "soft") {
        logRateLimitDecision(
          "Upstash rate limit failed in production for soft policy - allowing request",
          {
            prefix: normalizedPrefix,
            policy,
            keyType: "generic",
            environment,
            decision: "allow",
            reason: "upstash_failure_soft",
            error,
          }
        );
        return { allowed: true, remaining: 0 };
      }
      // In development, fall through to in-memory as a convenience
      logRateLimitDecision(
        "Upstash rate limit failed, falling back to in-memory",
        {
          prefix: normalizedPrefix,
          policy,
          keyType: "generic",
          environment,
          decision: "error",
          reason: "upstash_failure_dev_fallback",
          error,
        }
      );
    }
  } else if (process.env.NODE_ENV === "production" && policy === "strict") {
    // Fail closed in production when Redis credentials are not configured.
    // In-memory rate limiting does not persist across serverless invocations,
    // so it provides no real protection in production.
    logRateLimitDecision(
      "Redis credentials missing in production for strict rate-limit policy - rejecting request",
      {
        prefix: normalizedPrefix,
        policy,
        keyType: "generic",
        environment,
        decision: "deny",
        reason: "redis_credentials_missing_strict",
      }
    );
    return { allowed: false, remaining: 0, retryAfter: 30 };
  } else if (process.env.NODE_ENV === "production" && policy === "soft") {
    logRateLimitDecision(
      "Redis credentials missing in production for soft rate-limit policy - allowing request",
      {
        prefix: normalizedPrefix,
        policy,
        keyType: "generic",
        environment,
        decision: "allow",
        reason: "redis_credentials_missing_soft",
      }
    );
    return { allowed: true, remaining: 0 };
  }

  // Development fallback: in-memory rate limiting (single-server only)
  const fallbackResult = checkInMemoryRateLimit(
    key,
    normalizedPrefix,
    maxRequests,
    windowMs
  );
  logRateLimitDecision(
    fallbackResult.allowed
      ? "In-memory rate limit allowed"
      : "In-memory rate limit denied",
    {
      prefix: normalizedPrefix,
      policy,
      keyType: "generic",
      environment,
      decision: fallbackResult.allowed ? "allow" : "deny",
      reason: "in_memory_fallback",
    }
  );
  return fallbackResult;
}

/**
 * Reset the rate limit for a specific key.
 *
 * Uses Upstash's `resetUsedTokens` API to properly clear all sliding window
 * state (sorted sets + metadata), rather than a raw Redis DEL which may miss
 * internal keys.
 *
 * @param key - The rate limit key to reset
 * @param prefix - Redis key prefix matching the one used in checkRateLimit (default: "api")
 */
export async function resetRateLimit(
  key: string,
  prefix: string = "api"
): Promise<void> {
  // Get or create a limiter with the matching prefix to use its resetUsedTokens API.
  // The maxRequests/windowMs values don't affect the reset operation - they only
  // matter for the sliding window config - so we use sensible defaults.
  const normalizedPrefix = normalizeKeyPart(prefix);
  const limiter = getUpstashLimiter(normalizedPrefix, 100, 60000);
  const storageKey = buildRateLimitStorageKey(
    "generic",
    `${normalizedPrefix}:${key}`
  );
  if (limiter) {
    try {
      await limiter.resetUsedTokens(storageKey);
    } catch (error) {
      logger.warn("Failed to reset rate limit in Redis:", error);
    }
  }

  inMemoryStore.delete(`${normalizedPrefix}:${key}`);
}

// =============================================================================
// Common Rate Limit Configurations
// =============================================================================

/**
 * Common rate limit configurations shared across apps.
 *
 * App-specific rate limits should be defined in each app's own
 * `lib/rate-limit.ts` as a local `RATE_LIMITS` constant (for example Store
 * package downloads).
 */
export const RATE_LIMITS = {
  /** API calls: 100 per minute per identifier */
  API: { maxRequests: 100, windowMs: 60 * 1000 },
  /** Read-only actions: 300 per minute per identifier */
  READ: { maxRequests: 300, windowMs: 60 * 1000 },
} as const;

/** Test-only surface for rate-limit helpers and metrics (see `rate-limit.test.ts`). */
export const rateLimitInternals = {
  buildRateLimitStorageKey,
  clearMetrics(): void {
    rateLimitMetrics.clear();
  },
  getMetrics(): ReadonlyMap<string, number> {
    return new Map(rateLimitMetrics);
  },
};
