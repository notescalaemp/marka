export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): RateLimitResult;
}

// Fixed-window, in-memory limiter. Good enough for a single-instance
// deployment or local dev; on Vercel each serverless instance has its own
// memory, so this does NOT enforce a global limit across instances.
// Swap for an Upstash Redis-backed RateLimiter (same interface) before
// relying on this for production brute-force protection.
class InMemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    entry.count += 1;
    const allowed = entry.count <= limit;
    return { allowed, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt };
  }
}

export const rateLimiter: RateLimiter = new InMemoryRateLimiter();

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
