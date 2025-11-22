/**
 * Rate Limiter Utility
 * In-memory rate limiting for per-IP and per-UID tracking
 * Supports configurable limits and time windows
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

// Storage: {window}-{identifier} -> { count, resetAt }
const store: RateLimitStore = {};

// Cleanup interval (runs every 5 minutes to clear expired entries)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Check if a request is within rate limit
 * @param identifier - Unique identifier (IP, UID, or combination)
 * @param config - Rate limit configuration
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } {
  const now = Date.now();
  const key = identifier;

  // Initialize or get existing entry
  if (!store[key] || store[key].resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: store[key].resetAt,
    };
  }

  // Increment count
  store[key].count += 1;
  const remaining = Math.max(0, config.maxRequests - store[key].count);
  const allowed = store[key].count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetAt: store[key].resetAt,
    retryAfter: allowed ? undefined : Math.ceil((store[key].resetAt - now) / 1000),
  };
}

/**
 * Generate rate limit identifier for IP + action
 * @param ip - Client IP address
 * @param action - Action identifier (e.g., 'reservation', 'contact')
 * @returns Combined identifier
 */
export function getRateLimitKey(ip: string, action: string): string {
  return `${action}:${ip}`;
}

/**
 * Generate rate limit identifier for UID + action
 * @param uid - User ID
 * @param action - Action identifier
 * @returns Combined identifier
 */
export function getUserRateLimitKey(uid: string, action: string): string {
  return `user:${action}:${uid}`;
}

/**
 * Reset rate limit for an identifier (admin only)
 * @param identifier - Rate limit key
 */
export function resetRateLimit(identifier: string): void {
  delete store[identifier];
}

/**
 * Get current rate limit status (for debugging/admin)
 * @param identifier - Rate limit key
 * @returns Current count and reset time, or null if no entry
 */
export function getRateLimitStatus(identifier: string): { count: number; resetAt: number } | null {
  if (!store[identifier]) return null;
  return {
    count: store[identifier].count,
    resetAt: store[identifier].resetAt,
  };
}

/**
 * Clear all rate limit entries (for testing)
 */
export function clearAllLimits(): void {
  for (const key in store) {
    delete store[key];
  }
}

// Common rate limit configs
export const RATE_LIMITS = {
  RESERVATION: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute
  CONTACT: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  RESERVATION_EDIT: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 edits per minute
};
