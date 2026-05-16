/**
 * Stripe webhook handling.
 *
 * We don't use the Stripe Node SDK because it pulls in Node-only crypto.
 * Instead we verify the signature ourselves using Web Crypto (HMAC-SHA256),
 * which is exactly what the SDK does under the hood.
 *
 * Reference: https://stripe.com/docs/webhooks/signatures
 *   Stripe-Signature: t=<unix-ts>,v1=<hex-sig>[,v1=<other-sig>][,v0=...]
 *   Signed payload = `${t}.${rawBody}`
 *
 * We currently react to two events; everything else is logged and 200-acked
 * so Stripe doesn't keep retrying.
 */

import { setTier } from './quota';
import type { Env } from './env';

const TOLERANCE_SEC = 5 * 60; // Stripe default

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

export interface VerifyOptions {
  /** Test override for the clock (unix seconds). */
  now?: number;
  /** Test override for tolerance (seconds). */
  toleranceSec?: number;
}

export async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  opts: VerifyOptions = {},
): Promise<VerifyResult> {
  if (!header) return { ok: false, reason: 'missing_signature' };
  if (!secret) return { ok: false, reason: 'missing_secret' };

  const parsed = parseSigHeader(header);
  if (!parsed) return { ok: false, reason: 'malformed_signature' };

  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const tolerance = opts.toleranceSec ?? TOLERANCE_SEC;
  if (Math.abs(now - parsed.timestamp) > tolerance) {
    return { ok: false, reason: 'timestamp_outside_tolerance' };
  }

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const expected = await hmacSha256Hex(secret, signedPayload);

  // Stripe may include multiple v1 sigs during secret rotation — accept any
  // match. Use constant-time compare per sig to avoid timing attacks.
  const match = parsed.signatures.some((sig) => timingSafeEqualHex(sig, expected));
  return match ? { ok: true } : { ok: false, reason: 'signature_mismatch' };
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export interface HandleResult {
  status: number;
  body: { received: true; handled: boolean; type: string };
}

export async function handleStripeEvent(env: Env, event: StripeEvent): Promise<HandleResult> {
  // We expect Stripe `Subscription` objects to carry a `metadata.userId` field
  // that the checkout flow sets. This lets us bind the Stripe customer to our
  // internal user id without storing a Stripe-customer→user map.
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const userId = extractUserId(event.data.object);
      const status = (event.data.object as { status?: string }).status;
      if (userId && (status === 'active' || status === 'trialing')) {
        await setTier(env, userId, 'paid');
        return { status: 200, body: { received: true, handled: true, type: event.type } };
      }
      // Subscription transitioning to a non-active state → downgrade.
      if (userId && status && status !== 'active' && status !== 'trialing') {
        await setTier(env, userId, 'free');
        return { status: 200, body: { received: true, handled: true, type: event.type } };
      }
      console.warn('stripe_event_missing_user_id', event.type, event.id);
      return { status: 200, body: { received: true, handled: false, type: event.type } };
    }
    case 'customer.subscription.deleted': {
      const userId = extractUserId(event.data.object);
      if (userId) {
        await setTier(env, userId, 'free');
        return { status: 200, body: { received: true, handled: true, type: event.type } };
      }
      console.warn('stripe_event_missing_user_id', event.type, event.id);
      return { status: 200, body: { received: true, handled: false, type: event.type } };
    }
    default:
      // Unknown event types: ack with 200 so Stripe stops retrying. We log so
      // we can extend handling later without losing events.
      console.log('stripe_event_unhandled', event.type, event.id);
      return { status: 200, body: { received: true, handled: false, type: event.type } };
  }
}

function extractUserId(obj: Record<string, unknown>): string | null {
  const meta = obj.metadata;
  if (meta && typeof meta === 'object') {
    const m = meta as Record<string, unknown>;
    if (typeof m.userId === 'string' && m.userId.length > 0) return m.userId;
    if (typeof m.user_id === 'string' && m.user_id.length > 0) return m.user_id;
  }
  return null;
}

interface ParsedSig {
  timestamp: number;
  signatures: string[];
}

function parseSigHeader(header: string): ParsedSig | null {
  const parts = header.split(',');
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (!k || !v) continue;
    if (k === 't') {
      const n = Number(v);
      if (Number.isFinite(n)) timestamp = n;
    } else if (k === 'v1') {
      signatures.push(v);
    }
  }
  if (timestamp === null || signatures.length === 0) return null;
  return { timestamp, signatures };
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const bytes = new Uint8Array(sig);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += (bytes[i] ?? 0).toString(16).padStart(2, '0');
  }
  return hex;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
