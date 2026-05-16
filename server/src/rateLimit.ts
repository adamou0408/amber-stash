/**
 * Sliding-window rate limiter backed by Cloudflare KV.
 *
 * Algorithm: store an array of timestamps (ms) for each user. On each request
 * drop entries older than `windowMs`, then check `array.length` against the
 * limit. This is a true sliding window — not a fixed bucket — so a burst at
 * the boundary can't double the limit.
 *
 * KV is eventually consistent (~60s globally), but per-edge writes are read-
 * your-writes consistent for the same colo, which is the common case for a
 * single client repeatedly hitting one POP. For multi-region clients the worst
 * case is a brief over-limit window; acceptable for a vision-call API.
 *
 * For sub-second precision rate limiting, a Durable Object would be the right
 * tool — we deliberately use KV to keep deploy complexity low for v1.
 */

const WINDOW_MS = 60_000;
const KEY_PREFIX = 'rl:';

export interface RateLimitResult {
  allowed: boolean;
  /** Number of requests counted in the current window after this call. */
  count: number;
  /** Limit applied. */
  limit: number;
  /** Seconds the client should wait before retrying, when `allowed === false`. */
  retryAfterSec: number;
}

export interface RateLimitOptions {
  /** Identity key (per-user, per-IP, etc.). */
  id: string;
  /** Max requests per window. */
  limit: number;
  /** Window size in ms. Defaults to 60s. */
  windowMs?: number;
  /** Injectable clock for tests. */
  now?: () => number;
}

export async function checkRateLimit(
  kv: KVNamespace,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const windowMs = opts.windowMs ?? WINDOW_MS;
  const now = opts.now ? opts.now() : Date.now();
  const cutoff = now - windowMs;
  const key = `${KEY_PREFIX}${opts.id}`;

  const raw = await kv.get(key);
  const existing = parseTimestamps(raw);
  // Drop expired stamps.
  const recent = existing.filter((t) => t > cutoff);

  if (recent.length >= opts.limit) {
    // Compute when the oldest in-window entry expires; that's the earliest
    // moment the client can try again.
    const oldest = recent[0] ?? now;
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    return {
      allowed: false,
      count: recent.length,
      limit: opts.limit,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  recent.push(now);

  // Persist with a TTL slightly longer than the window so KV self-cleans
  // abandoned buckets. KV minimum TTL is 60 seconds.
  const ttlSec = Math.max(60, Math.ceil(windowMs / 1000) + 10);
  await kv.put(key, serializeTimestamps(recent), { expirationTtl: ttlSec });

  return { allowed: true, count: recent.length, limit: opts.limit, retryAfterSec: 0 };
}

function parseTimestamps(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  } catch {
    return [];
  }
}

function serializeTimestamps(ts: number[]): string {
  return JSON.stringify(ts);
}
