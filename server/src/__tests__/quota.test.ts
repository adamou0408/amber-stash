import { describe, it, expect, beforeEach, vi } from 'vitest';
import { consumeQuota, getQuotaState, getTier, monthBucket, setTier } from '../quota';
import { handleRequest } from '../index';
import { getEnv, clearKv, makeRequest } from './testEnv';

describe('quota (unit)', () => {
  beforeEach(async () => {
    const env = getEnv();
    await clearKv(env.QUOTA_KV);
    await clearKv(env.USER_TIER_KV);
  });

  it('defaults to free tier when nothing in KV', async () => {
    const env = getEnv();
    const tier = await getTier(env, 'newbie');
    expect(tier).toBe('free');
  });

  it('free tier: increments to limit then blocks', async () => {
    const env = getEnv();
    const userId = 'u_free';
    const limit = parseInt(env.FREE_MONTHLY_QUOTA, 10);

    for (let i = 0; i < limit; i++) {
      const r = await consumeQuota(env, userId);
      expect(r.ok).toBe(true);
      expect(r.used).toBe(i + 1);
      expect(r.tier).toBe('free');
    }

    const blocked = await consumeQuota(env, userId);
    expect(blocked.ok).toBe(false);
    expect(blocked.used).toBe(limit);
    expect(blocked.limit).toBe(limit);
  });

  it('paid tier: never blocks and reports Infinity limit', async () => {
    const env = getEnv();
    const userId = 'u_paid';
    await setTier(env, userId, 'paid');

    for (let i = 0; i < 50; i++) {
      const r = await consumeQuota(env, userId);
      expect(r.ok).toBe(true);
      expect(r.tier).toBe('paid');
      expect(r.limit).toBe(Number.POSITIVE_INFINITY);
    }
  });

  it('uses UTC month bucket', () => {
    const b = monthBucket(new Date(Date.UTC(2026, 4, 16, 23, 59, 0)));
    expect(b).toBe('2026-05');
  });

  it('reports correct state via getQuotaState', async () => {
    const env = getEnv();
    const userId = 'u_state';
    await consumeQuota(env, userId);
    await consumeQuota(env, userId);
    const s = await getQuotaState(env, userId);
    expect(s.used).toBe(2);
    expect(s.tier).toBe('free');
    expect(s.limit).toBe(10);
    expect(s.bucket).toBe(monthBucket());
  });
});

describe('POST /v1/messages — quota enforcement', () => {
  beforeEach(async () => {
    const env = getEnv();
    await clearKv(env.QUOTA_KV);
    await clearKv(env.USER_TIER_KV);
    await clearKv(env.RATE_LIMIT_KV);
  });

  it('free user: returns 402 after monthly limit', async () => {
    const env = getEnv();
    const limit = parseInt(env.FREE_MONTHLY_QUOTA, 10);
    const ip = '203.0.113.10';
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'm', content: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const body = JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] });
    const make = () =>
      makeRequest('https://proxy.example/v1/messages', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json' },
        ip,
      });

    for (let i = 0; i < limit; i++) {
      const r = await handleRequest(make(), env, {
        forwardOptions: { fetchImpl: fakeFetch as unknown as typeof fetch },
      });
      expect(r.status).toBe(200);
    }
    const blocked = await handleRequest(make(), env, {
      forwardOptions: { fetchImpl: fakeFetch as unknown as typeof fetch },
    });
    expect(blocked.status).toBe(402);
    const body402 = (await blocked.json()) as { error: { code: string; type: string; details?: { tier: string } } };
    expect(body402.error.code).toBe('monthly_quota_exhausted');
    expect(body402.error.type).toBe('quota_exceeded');
    expect(body402.error.details?.tier).toBe('free');
  });

  it('paid user: not blocked beyond free limit', async () => {
    const env = getEnv();
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'm', content: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const ip = '203.0.113.20';

    // Resolve the userId the way the handler will, then mark paid.
    const probe = makeRequest('https://proxy.example/v1/quota', { method: 'GET', ip });
    const probeResp = await handleRequest(probe, env);
    const probeBody = (await probeResp.json()) as { userId: string };
    await env.USER_TIER_KV.put(probeBody.userId, 'paid');

    const body = JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] });
    for (let i = 0; i < 20; i++) {
      const r = await handleRequest(
        makeRequest('https://proxy.example/v1/messages', {
          method: 'POST',
          body,
          headers: { 'content-type': 'application/json' },
          ip,
        }),
        env,
        { forwardOptions: { fetchImpl: fakeFetch as unknown as typeof fetch } },
      );
      expect(r.status).toBe(200);
      expect(r.headers.get('x-amber-tier')).toBe('paid');
      expect(r.headers.get('x-amber-quota-limit')).toBe('unlimited');
    }
  });

  it('GET /v1/quota returns current state', async () => {
    const env = getEnv();
    const ip = '203.0.113.30';
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'm', content: [] }), { status: 200 }),
    );

    // Burn 2 calls.
    for (let i = 0; i < 2; i++) {
      await handleRequest(
        makeRequest('https://proxy.example/v1/messages', {
          method: 'POST',
          body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
          headers: { 'content-type': 'application/json' },
          ip,
        }),
        env,
        { forwardOptions: { fetchImpl: fakeFetch as unknown as typeof fetch } },
      );
    }

    const resp = await handleRequest(
      makeRequest('https://proxy.example/v1/quota', { method: 'GET', ip }),
      env,
    );
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { used: number; limit: number; tier: string };
    expect(body.used).toBe(2);
    expect(body.limit).toBe(10);
    expect(body.tier).toBe('free');
  });
});
