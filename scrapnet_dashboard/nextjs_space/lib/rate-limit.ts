// lib/rate-limit.ts
// Zero-dependency, in-memory sliding-window rate limiter.
// Used by /api/bedrockfad/intake with two independent keyspaces:
//   checkRateLimit(`ip:${clientIp}`)    and    checkRateLimit(`email:${contactEmail}`)
// Either one returning { allowed: false } => caller responds 429.
//
// NOTE: in-memory state is per-process. On a single-node deployment (this VM)
// that is sufficient. It intentionally carries no external dependency.

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

// key -> ascending list of request timestamps (ms epoch) within the window
const buckets = new Map<string, number[]>();

/**
 * Sliding-window limiter.
 * @param key         Namespaced identity, e.g. `ip:1.2.3.4` or `email:a@b.com`.
 * @param maxRequests Max requests permitted within the window. Default 5.
 * @param windowMs    Window length in milliseconds. Default 60_000 (1 min).
 */
export function checkRateLimit(
  key: string,
  maxRequests = 5,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Prune stale buckets each call to prevent unbounded memory growth.
  for (const [k, stamps] of buckets) {
    const live = stamps.filter((t) => t > windowStart);
    if (live.length === 0) {
      buckets.delete(k);
    } else if (live.length !== stamps.length) {
      buckets.set(k, live);
    }
  }

  const existing = buckets.get(key) ?? [];
  const recent = existing.filter((t) => t > windowStart);

  if (recent.length >= maxRequests) {
    // Oldest timestamp in window determines when a slot frees up.
    const oldest = recent[0];
    const retryAfterMs = oldest + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    buckets.set(key, recent);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true };
}
