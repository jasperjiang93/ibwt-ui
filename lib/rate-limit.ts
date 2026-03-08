// Simple in-memory rate limiter for API routes.
// Resets on server restart — sufficient for spam prevention on low-traffic routes.

const hits = new Map<string, number[]>();

/**
 * Returns true if the request should be blocked.
 * @param key   Unique identifier (e.g. IP address)
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const timestamps = hits.get(key) || [];

  // Remove expired entries
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= limit) {
    hits.set(key, valid);
    return true;
  }

  valid.push(now);
  hits.set(key, valid);
  return false;
}

/** Extract a usable key from the request (IP or fallback) */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
