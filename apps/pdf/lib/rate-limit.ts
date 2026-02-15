/**
 * Rate Limiting Module
 *
 * Provides distributed rate limiting using Upstash Redis for production
 * environments. In production, fails closed (rejects requests) when Redis
 * is unavailable or when Upstash credentials are not configured. Falls back
 * to in-memory rate limiting only in development.
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

import { logger } from "@/lib/logger";

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

// =============================================================================
// Upstash Redis Client (singleton)
// =============================================================================

let redis: Redis | null = null;
let hasWarnedMissingRedis = false;

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
          "Rate limiting will fail closed (reject all rate-limited requests) in production. " +
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

  const key = `${prefix}:${maxRequests}:${windowMs}`;
  let limiter = rateLimiters.get(key);

  if (!limiter) {
    const windowSec = Math.ceil(windowMs / 1000);
    const duration: `${number} m` | `${number} s` =
      windowSec >= 60 ? `${Math.ceil(windowSec / 60)} m` : `${windowSec} s`;

    limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(maxRequests, duration),
      prefix: `ratelimit:${prefix}`,
      analytics: false,
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

const CLEANUP_INTERVAL = 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

/** Start periodic cleanup of expired in-memory records. */
function startCleanup(): void {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of inMemoryStore.entries()) {
      if (now > record.resetTime) {
        inMemoryStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  cleanupTimer.unref();
}

/** In-memory rate limit check (fallback for development). */
function checkInMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const record = inMemoryStore.get(key);

  if (!record || now > record.resetTime) {
    inMemoryStore.set(key, { count: 1, resetTime: now + windowMs });
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
 * Uses Upstash Redis in production (distributed). In production, fails closed
 * (rejects requests) if Redis is unavailable or if credentials are not configured.
 * In development, falls back to in-memory when credentials are not configured.
 *
 * @param key - Unique identifier for the rate limit (e.g., IP + endpoint)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @param prefix - Redis key prefix for the limiter (default: "api"). Different
 *   prefixes create separate Upstash Ratelimit instances and Redis key namespaces.
 * @returns Rate limit result with allowed status and remaining requests
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000,
  prefix: string = "api"
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(prefix, maxRequests, windowMs);

  if (limiter) {
    try {
      const result = await limiter.limit(key);

      if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
        return {
          allowed: false,
          remaining: result.remaining,
          retryAfter: Math.max(retryAfter, 1),
        };
      }

      return { allowed: true, remaining: result.remaining };
    } catch (error) {
      // In production, fail closed (reject the request) when Redis is unavailable.
      // In-memory fallback does not persist across serverless invocations,
      // making it ineffective for distributed rate limiting.
      if (process.env.NODE_ENV === "production") {
        logger.error(
          "Upstash rate limit failed in production — failing closed:",
          error
        );
        return { allowed: false, remaining: 0, retryAfter: 30 };
      }
      // In development, fall through to in-memory as a convenience
      logger.warn(
        "Upstash rate limit failed, falling back to in-memory:",
        error
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    // Fail closed in production when Redis credentials are not configured.
    // In-memory rate limiting does not persist across serverless invocations,
    // so it provides no real protection in production.
    return { allowed: false, remaining: 0, retryAfter: 30 };
  }

  // Development fallback: in-memory rate limiting (single-server only)
  return checkInMemoryRateLimit(key, maxRequests, windowMs);
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
  // The maxRequests/windowMs values don't affect the reset operation — they only
  // matter for the sliding window config — so we use sensible defaults.
  const limiter = getUpstashLimiter(prefix, 100, 60000);
  if (limiter) {
    try {
      await limiter.resetUsedTokens(key);
    } catch (error) {
      logger.warn("Failed to reset rate limit in Redis:", error);
    }
  }

  inMemoryStore.delete(key);
}

/**
 * Rate limit configurations for different endpoints.
 *
 * App-specific rate limits are defined in each repo's own copy of this file.
 * This shared version only includes the common API limit.
 */
export const RATE_LIMITS = {
  /** API calls: 100 per minute per user */
  API: { maxRequests: 100, windowMs: 60 * 1000 },
  /** Auth callback: 20 per minute per IP */
  AUTH_CALLBACK: { maxRequests: 20, windowMs: 60 * 1000 },
} as const;
