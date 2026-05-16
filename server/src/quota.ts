/**
 * Monthly call quota.
 *
 * Key format: `quota:{userId}:{YYYY-MM}` → integer count (string-encoded).
 * Tier lookup: `USER_TIER_KV.get(userId)` → 'free' | 'paid'.
 *   - Default tier when missing: 'free'.
 *   - 'paid' is unlimited (no KV write either, to save writes).
 *
 * KV is eventually consistent so under high concurrency a free user could
 * briefly exceed by ~1 call across regions. Acceptable for v1; tighten with
 * Durable Objects if abuse is observed.
 */

import type { Env, Tier } from './env';

export interface QuotaState {
  used: number;
  limit: number;
  tier: Tier;
  /** Bucket key (YYYY-MM) the values apply to. */
  bucket: string;
}

export interface ConsumeResult extends QuotaState {
  /** True if there was capacity to consume; false means quota exceeded. */
  ok: boolean;
}

export function monthBucket(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function getTier(env: Env, userId: string): Promise<Tier> {
  const raw = await env.USER_TIER_KV.get(userId);
  return raw === 'paid' ? 'paid' : 'free';
}

export async function setTier(env: Env, userId: string, tier: Tier): Promise<void> {
  if (tier === 'paid') {
    await env.USER_TIER_KV.put(userId, 'paid');
  } else {
    // We could `delete`, but storing 'free' explicitly makes auditing easier.
    await env.USER_TIER_KV.put(userId, 'free');
  }
}

export async function getQuotaState(env: Env, userId: string, now?: Date): Promise<QuotaState> {
  const bucket = monthBucket(now);
  const tier = await getTier(env, userId);
  const limit = tier === 'paid' ? Number.POSITIVE_INFINITY : freeLimit(env);
  const usedRaw = await env.QUOTA_KV.get(quotaKey(userId, bucket));
  const used = parseInt(usedRaw ?? '0', 10) || 0;
  return { used, limit, tier, bucket };
}

/**
 * Atomically increment monthly quota if there is capacity. Returns
 * `{ ok: false, ... }` when the user is on free tier and already at the limit.
 *
 * Paid tier is never blocked and we skip the write to minimize KV writes.
 * If you ever need accurate paid-tier usage (e.g. for usage-based billing),
 * remove the early-return.
 */
export async function consumeQuota(
  env: Env,
  userId: string,
  now?: Date,
): Promise<ConsumeResult> {
  const state = await getQuotaState(env, userId, now);

  if (state.tier === 'paid') {
    return { ok: true, ...state };
  }

  if (state.used >= state.limit) {
    return { ok: false, ...state };
  }

  const next = state.used + 1;
  await env.QUOTA_KV.put(quotaKey(userId, state.bucket), String(next), {
    // Keep usage rows for ~70 days so we have a small grace period after the
    // month rolls over (for invoicing / debugging).
    expirationTtl: 60 * 60 * 24 * 70,
  });

  return { ok: true, used: next, limit: state.limit, tier: state.tier, bucket: state.bucket };
}

function quotaKey(userId: string, bucket: string): string {
  return `quota:${userId}:${bucket}`;
}

function freeLimit(env: Env): number {
  const n = parseInt(env.FREE_MONTHLY_QUOTA, 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
}
