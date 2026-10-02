import type { MiddlewareHandler } from 'hono';

/**
 * 極簡 in-memory sliding-window rate limiter，以 client IP 為 key。
 * beta 單機夠用；多實例 / 需跨重啟保存時改 Redis 或 DB。
 *
 * 注意：這是「濫用防護」而非「per-user 配額」—— 後者需要使用者身分（auth），
 * 留到接 Supabase 後再做。client 端的 quota.ts 維持顯示用。
 */
export function createRateLimiter(opts: { windowMs: number; max: number }): MiddlewareHandler {
  const hits = new Map<string, number[]>();

  return async (c, next) => {
    const now = Date.now();
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown';

    const windowStart = now - opts.windowMs;
    const recent = (hits.get(ip) ?? []).filter((t) => t > windowStart);

    if (recent.length >= opts.max) {
      const retryAfterMs = recent[0]! + opts.windowMs - now;
      c.header('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
      return c.json(
        { error: 'rate_limited', message: '請求過於頻繁，請稍後再試。' },
        429,
      );
    }

    recent.push(now);
    hits.set(ip, recent);

    // 順手回收：偶發清掉空 entry，避免 map 無限長
    if (hits.size > 10_000) {
      for (const [k, v] of hits) {
        if (v.every((t) => t <= windowStart)) hits.delete(k);
      }
    }

    await next();
  };
}
