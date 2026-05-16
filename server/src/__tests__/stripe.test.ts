import { describe, it, expect, beforeEach } from 'vitest';
import { handleStripeEvent, verifyStripeSignature, type StripeEvent } from '../stripe';
import { getTier } from '../quota';
import { handleRequest } from '../index';
import { getEnv, clearKv, makeRequest } from './testEnv';

async function makeStripeSignature(payload: string, secret: string, timestamp: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const bytes = new Uint8Array(sig);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += (bytes[i] ?? 0).toString(16).padStart(2, '0');
  return `t=${timestamp},v1=${hex}`;
}

describe('verifyStripeSignature', () => {
  const secret = 'whsec_test_secret';
  const payload = JSON.stringify({ id: 'evt_1', type: 'ping' });
  const now = 1700000000;

  it('accepts a valid signature', async () => {
    const header = await makeStripeSignature(payload, secret, now);
    const r = await verifyStripeSignature(payload, header, secret, { now });
    expect(r.ok).toBe(true);
  });

  it('rejects missing header', async () => {
    const r = await verifyStripeSignature(payload, null, secret, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('missing_signature');
  });

  it('rejects malformed header', async () => {
    const r = await verifyStripeSignature(payload, 'garbage', secret, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('malformed_signature');
  });

  it('rejects wrong secret', async () => {
    const header = await makeStripeSignature(payload, secret, now);
    const r = await verifyStripeSignature(payload, header, 'whsec_wrong', { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('signature_mismatch');
  });

  it('rejects tampered payload', async () => {
    const header = await makeStripeSignature(payload, secret, now);
    const r = await verifyStripeSignature(payload + 'x', header, secret, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('signature_mismatch');
  });

  it('rejects expired timestamp', async () => {
    const oldTs = now - 60 * 60; // 1 hour ago
    const header = await makeStripeSignature(payload, secret, oldTs);
    const r = await verifyStripeSignature(payload, header, secret, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('timestamp_outside_tolerance');
  });
});

describe('handleStripeEvent — KV writes', () => {
  beforeEach(async () => {
    const env = getEnv();
    await clearKv(env.USER_TIER_KV);
  });

  it('customer.subscription.created with active status → paid', async () => {
    const env = getEnv();
    const event: StripeEvent = {
      id: 'evt_sub_created',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_123',
          status: 'active',
          metadata: { userId: 'u_alpha' },
        },
      },
    };
    const r = await handleStripeEvent(env, event);
    expect(r.status).toBe(200);
    expect(r.body.handled).toBe(true);
    expect(await getTier(env, 'u_alpha')).toBe('paid');
  });

  it('customer.subscription.deleted → free', async () => {
    const env = getEnv();
    await env.USER_TIER_KV.put('u_beta', 'paid');
    const event: StripeEvent = {
      id: 'evt_sub_deleted',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_999', metadata: { userId: 'u_beta' } } },
    };
    const r = await handleStripeEvent(env, event);
    expect(r.status).toBe(200);
    expect(await getTier(env, 'u_beta')).toBe('free');
  });

  it('subscription.updated with canceled status → free', async () => {
    const env = getEnv();
    await env.USER_TIER_KV.put('u_gamma', 'paid');
    const event: StripeEvent = {
      id: 'evt_sub_canceled',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_g', status: 'canceled', metadata: { userId: 'u_gamma' } } },
    };
    const r = await handleStripeEvent(env, event);
    expect(r.status).toBe(200);
    expect(await getTier(env, 'u_gamma')).toBe('free');
  });

  it('unknown event types ack with 200 but handled:false', async () => {
    const env = getEnv();
    const event: StripeEvent = {
      id: 'evt_unknown',
      type: 'charge.refunded',
      data: { object: {} },
    };
    const r = await handleStripeEvent(env, event);
    expect(r.status).toBe(200);
    expect(r.body.handled).toBe(false);
  });

  it('events missing userId metadata: 200 / handled:false', async () => {
    const env = getEnv();
    const event: StripeEvent = {
      id: 'evt_no_meta',
      type: 'customer.subscription.created',
      data: { object: { id: 'sub_x', status: 'active' } },
    };
    const r = await handleStripeEvent(env, event);
    expect(r.status).toBe(200);
    expect(r.body.handled).toBe(false);
  });
});

describe('POST /v1/stripe/webhook — end-to-end', () => {
  beforeEach(async () => {
    const env = getEnv();
    await clearKv(env.USER_TIER_KV);
  });

  it('full happy path: signed event upgrades tier in KV', async () => {
    const env = getEnv();
    const payload = JSON.stringify({
      id: 'evt_e2e',
      type: 'customer.subscription.created',
      data: { object: { id: 'sub_e2e', status: 'active', metadata: { userId: 'u_e2e' } } },
    });
    const ts = Math.floor(Date.now() / 1000);
    const sig = await makeStripeSignature(payload, env.STRIPE_WEBHOOK_SECRET, ts);

    const req = makeRequest('https://proxy.example/v1/stripe/webhook', {
      method: 'POST',
      body: payload,
      headers: { 'content-type': 'application/json', 'stripe-signature': sig },
    });
    const resp = await handleRequest(req, env);
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { received: boolean; handled: boolean };
    expect(body.received).toBe(true);
    expect(body.handled).toBe(true);

    expect(await getTier(env, 'u_e2e')).toBe('paid');
  });

  it('rejects unsigned webhook with 400', async () => {
    const env = getEnv();
    const payload = JSON.stringify({ id: 'evt_x', type: 'ping', data: { object: {} } });
    const req = makeRequest('https://proxy.example/v1/stripe/webhook', {
      method: 'POST',
      body: payload,
      headers: { 'content-type': 'application/json' },
    });
    const resp = await handleRequest(req, env);
    expect(resp.status).toBe(400);
    const body = (await resp.json()) as { error: { code: string } };
    expect(body.error.code).toBe('invalid_signature');
  });

  it('rejects tampered payload (signature mismatch)', async () => {
    const env = getEnv();
    const original = JSON.stringify({ id: 'evt_t', type: 'ping', data: { object: {} } });
    const tampered = JSON.stringify({ id: 'evt_t', type: 'ping', data: { object: { extra: 1 } } });
    const ts = Math.floor(Date.now() / 1000);
    const sig = await makeStripeSignature(original, env.STRIPE_WEBHOOK_SECRET, ts);

    const req = makeRequest('https://proxy.example/v1/stripe/webhook', {
      method: 'POST',
      body: tampered,
      headers: { 'content-type': 'application/json', 'stripe-signature': sig },
    });
    const resp = await handleRequest(req, env);
    expect(resp.status).toBe(400);
  });
});
