import { NextRequest, NextResponse } from 'next/server';

/**
 * Per-IP rate limiting for the authentication endpoints.
 *
 * The app already locks an individual account after repeated failures, but that
 * is keyed on the account: it does nothing about one address trying a common
 * password against many usernames, or hammering the password-reset endpoint to
 * mine which addresses are registered.
 *
 * This is an in-process fixed-window counter. That is honest about its limits:
 * it resets when the process restarts, and it counts per instance rather than
 * per cluster. For a two-person app behind one Node process it is the right
 * amount of machinery; if this ever runs more than one instance, move the
 * counter to Redis or the database.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Drop expired entries so the map cannot grow without bound. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Best-effort client address. Behind a reverse proxy the socket address is the
 * proxy, so X-Forwarded-For is consulted first - which means the proxy must be
 * configured to set it, and must not pass through a client-supplied value.
 */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export interface RateLimitOptions {
  /** Distinguishes one endpoint's budget from another's. */
  name: string;
  limit: number;
  windowSeconds: number;
}

/**
 * Consume one unit. Returns a 429 response when the budget is exhausted, or
 * null to continue.
 */
export function rateLimit(
  request: NextRequest,
  { name, limit, windowSeconds }: RateLimitOptions
): NextResponse | null {
  const now = Date.now();
  sweep(now);

  const key = `${name}:${clientIp(request)}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return null;
  }

  existing.count += 1;
  if (existing.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return NextResponse.json(
    { error: 'Too many attempts. Please try again in a moment.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

/** Clear a budget after a legitimate success, so one good login resets it. */
export function resetRateLimit(request: NextRequest, name: string): void {
  buckets.delete(`${name}:${clientIp(request)}`);
}
