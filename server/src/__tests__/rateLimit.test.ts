import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from '../rateLimit';
import { handleRequest } from '../index';
import { getEnv, clearKv, makeRequest } from './testEnv';

describe('checkRateLimit (unit)', () => {
  beforeEach(async () => {
    const env = getEnv();
    await clearKv(env.RATE_LIMIT_KV);
  });

  it('allows up to limit, blocks limit+1 within window', async () => {
    const env = getEnv();
    const id = 'user_a';
    const limit = 60;

    for (let i = 0; i < limit; i++) {
      const r = await checkRateLimit(env.RATE_LIMIT_KV, { id, limit });
      expect(r.allowed).toBe(true);
      expect(r.count).toBe(i + 1);
    }

    const overflow = await checkRateLimit(env.RATE_LIMIT_KV, { id, limit });
    expect(overflow.allowed).toBe(false);
    expect(overflow.count).toBe(limit);
    expect(overflow.retryAfterSec).toBeGreaterThan(0);
  });

  it('allows again after the window slides past oldest entry', async () => {
    const env = getEnv();
    const id = 'user_b';
    const limit = 3;
    const windowMs = 1000;
    let clock = 1_000_000;
    const now = () => clock;

    for (let i = 0; i < limit; i++) {
      await checkRateLimit(env.RATE_LIMIT_KV, { id, limit, windowMs, now });
    }

    // Still inside window → blocked.
    const blocked = await checkRateLimit(env.RATE_LIMIT_KV, { id, limit, windowMs, now });
    expect(blocked.allowed).toBe(false);

    // Slide clock past the window — old entries drop out.
    clock += windowMs + 100;
    const allowed = await checkRateLimit(env.RATE_LIMIT_KV, { id, limit, windowMs, now });
    expect(allowed.allowed).toBe(true);
  });

  it('isolates per-id', async () => {
    const env = getEnv();
    const limit = 2;

    await checkRateLimit(env.RATE_LIMIT_KV, { id: 'x', limit });
    await checkRateLimit(env.RATE_LIMIT_KV, { id: 'x', limit });
    const xBlocked = await checkRateLimit(env.RATE_LIMIT_KV, { id: 'x', limit });
    expect(xBlocked.allowed).toBe(false);

    const yFresh = await checkRateLimit(env.RATE_LIMIT_KV, { id: 'y', limit });
    expect(yFresh.allowed).toBe(true);
  });
});

describe('POST /v1/messages — 429 trip', () => {
  beforeEach(async () => {
    const env = getEnv();
    await clearKv(env.RATE_LIMIT_KV);
    await clearKv(env.QUOTA_KV);
    await clearKv(env.USER_TIER_KV);
  });

  it('60th call OK, 61st call 429 with Retry-After', async () => {
    const env = getEnv();
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'm', content: [{ type: 'text', text: 'ok' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const ip = '198.51.100.42';
    const body = JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] });

    const make = () =>
      makeRequest('https://proxy.example/v1/messages', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json' },
        ip,
      });

    // Discover the userId the handler would generate for this IP, then mark
    // them paid so quota doesn't trip before rate limit (rate limit is per-min,
    // free quota is 10/mo — without this the test would hit 402 at call 11).
    const probeResp = await handleRequest(
      makeRequest('https://proxy.example/v1/quota', { method: 'GET', ip }),
      env,
    );
    const probeBody = (await probeResp.json()) as { userId: string };
    await env.USER_TIER_KV.put(probeBody.userId, 'paid');

    let lastResp: Response | undefined;
    for (let i = 0; i < 60; i++) {
      lastResp = await handleRequest(make(), env, {
        forwardOptions: { fetchImpl: fakeFetch as unknown as typeof fetch },
      });
      expect(lastResp.status).toBe(200);
    }

    const blocked = await handleRequest(make(), env, {
      forwardOptions: { fetchImpl: fakeFetch as unknown as typeof fetch },
    });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeTruthy();
    const body429 = (await blocked.json()) as { error: { code: string; type: string } };
    expect(body429.error.code).toBe('too_many_requests');
    expect(body429.error.type).toBe('rate_limit_error');
  });
});
