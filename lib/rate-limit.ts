/**
 * Rate Limiting Module
 *
 * Provides distributed rate limiting using Upstash Redis for production
 * environments. In production, fails closed (rejects requests) when Redis
 * is unavailable or when Upstash credentials are not configured. Falls back
 * to in-memory rate limiting only in development.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/logger";

// Types
/**
 *
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

// Upstash Redis Client (singleton)
let redis: Redis | null = null;
let hasWarnedMissingRedis = false;

/**
 *
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
          "Rate limiting will fail closed in production."
      );
    }
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

// Rate Limiter Instances (cached)
const rateLimiters = new Map<string, Ratelimit>();

/**
 *
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

// In-Memory Fallback (development only)
/**
 *
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitRecord>();
const CLEANUP_INTERVAL = 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 *
 */
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

/**
 *
 */
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

// Public API
/**
 *
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
      if (process.env.NODE_ENV === "production") {
        logger.error(
          "Upstash rate limit failed in production — failing closed:",
          error
        );
        return { allowed: false, remaining: 0, retryAfter: 30 };
      }
      logger.warn(
        "Upstash rate limit failed, falling back to in-memory:",
        error
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    return { allowed: false, remaining: 0, retryAfter: 30 };
  }

  return checkInMemoryRateLimit(key, maxRequests, windowMs);
}

export const RATE_LIMITS = {
  /** API calls: 100 per minute per user */
  API: { maxRequests: 100, windowMs: 60 * 1000 },
} as const;
