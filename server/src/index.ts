/**
 * Amber Stash Cloudflare Worker — entrypoint.
 *
 * Routes:
 *   POST /v1/messages          → proxy to Anthropic (after rate-limit + quota)
 *   POST /v1/stripe/webhook    → Stripe subscription events → tier KV
 *   GET  /v1/quota             → caller's current quota + tier
 *   GET  /health               → simple liveness probe
 *
 * Every error response uses the `errorBody` envelope so clients have one shape
 * to parse. CORS is added by `withCors` — adjust `ALLOWED_ORIGINS` in wrangler
 * vars to lock down the frontend(s) that may call this proxy.
 */

import { errorBody, type Env } from './env';
import { getUserId } from './userId';
import { checkRateLimit } from './rateLimit';
import { consumeQuota, getQuotaState } from './quota';
import {
  forwardToAnthropic,
  validateClaudeRequest,
  type ForwardOptions,
} from './proxy';
import { handleStripeEvent, verifyStripeSignature, type StripeEvent } from './stripe';

export interface HandleOptions {
  /** Inject fetch for tests. */
  forwardOptions?: ForwardOptions;
  /** Inject clock for tests. */
  now?: () => number;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },
};

export async function handleRequest(
  request: Request,
  env: Env,
  opts: HandleOptions = {},
): Promise<Response> {
  const url = new URL(request.url);

  // CORS preflight applies to every route.
  if (request.method === 'OPTIONS') {
    return withCors(env, request, new Response(null, { status: 204 }));
  }

  let resp: Response;
  try {
    resp = await route(request, env, url, opts);
  } catch (err) {
    console.error('unhandled_error', err);
    resp = jsonResponse(
      500,
      errorBody('api_error', 'internal_error', 'Internal proxy error.'),
    );
  }
  return withCors(env, request, resp);
}

async function route(
  request: Request,
  env: Env,
  url: URL,
  opts: HandleOptions,
): Promise<Response> {
  const path = url.pathname;

  if (request.method === 'GET' && path === '/health') {
    return jsonResponse(200, { ok: true });
  }

  if (request.method === 'GET' && path === '/v1/quota') {
    return handleQuotaGet(request, env);
  }

  if (request.method === 'POST' && path === '/v1/messages') {
    return handleMessages(request, env, opts);
  }

  if (request.method === 'POST' && path === '/v1/stripe/webhook') {
    return handleStripeWebhook(request, env);
  }

  return jsonResponse(
    404,
    errorBody('not_found_error', 'route_not_found', `No route for ${request.method} ${path}.`),
  );
}

async function handleQuotaGet(request: Request, env: Env): Promise<Response> {
  const userId = await getUserId(request);
  const state = await getQuotaState(env, userId);
  return jsonResponse(200, {
    userId,
    tier: state.tier,
    used: state.used,
    limit: Number.isFinite(state.limit) ? state.limit : null,
    bucket: state.bucket,
  });
}

async function handleMessages(
  request: Request,
  env: Env,
  opts: HandleOptions,
): Promise<Response> {
  const userId = await getUserId(request);

  // 1. Rate limit (cheap, no upstream call).
  const rateLimit = parseInt(env.RATE_LIMIT_PER_MIN, 10) || 60;
  const rl = await checkRateLimit(env.RATE_LIMIT_KV, {
    id: userId,
    limit: rateLimit,
    now: opts.now,
  });
  if (!rl.allowed) {
    return new Response(
      JSON.stringify(
        errorBody(
          'rate_limit_error',
          'too_many_requests',
          `Too many requests. Try again in ${rl.retryAfterSec}s.`,
          { limit: rl.limit, retryAfterSec: rl.retryAfterSec },
        ),
      ),
      {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'retry-after': String(rl.retryAfterSec),
        },
      },
    );
  }

  // 2. Parse body before quota — invalid JSON shouldn't burn a quota slot.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse(
      400,
      errorBody('invalid_request_error', 'invalid_json', 'Request body must be valid JSON.'),
    );
  }
  const validation = validateClaudeRequest(raw);
  if (!validation.ok) {
    return jsonResponse(validation.status, validation.body);
  }

  // 3. Quota — also cheap, also no upstream call.
  const quota = await consumeQuota(env, userId);
  if (!quota.ok) {
    return jsonResponse(
      402,
      errorBody(
        'quota_exceeded',
        'monthly_quota_exhausted',
        `Free tier monthly quota of ${quota.limit} calls exhausted. Upgrade to continue.`,
        {
          tier: quota.tier,
          used: quota.used,
          limit: quota.limit,
          bucket: quota.bucket,
        },
      ),
    );
  }

  // 4. Forward to Anthropic.
  const resp = await forwardToAnthropic(env, validation.body, opts.forwardOptions);

  // Add diagnostic headers so the client can show quota state without an extra
  // /v1/quota round-trip.
  const headers = new Headers(resp.headers);
  headers.set('x-amber-quota-used', String(quota.used));
  headers.set(
    'x-amber-quota-limit',
    Number.isFinite(quota.limit) ? String(quota.limit) : 'unlimited',
  );
  headers.set('x-amber-tier', quota.tier);
  return new Response(resp.body, { status: resp.status, headers });
}

async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const sig = request.headers.get('stripe-signature');
  const payload = await request.text();

  const verify = await verifyStripeSignature(payload, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!verify.ok) {
    console.warn('stripe_signature_invalid', verify.reason);
    return jsonResponse(
      400,
      errorBody('invalid_request_error', 'invalid_signature', `Stripe signature verification failed: ${verify.reason}.`),
    );
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return jsonResponse(
      400,
      errorBody('invalid_request_error', 'invalid_json', 'Webhook payload was not valid JSON.'),
    );
  }
  if (!event.type || !event.data?.object) {
    return jsonResponse(
      400,
      errorBody('invalid_request_error', 'invalid_event', 'Webhook payload is missing `type` or `data.object`.'),
    );
  }

  const result = await handleStripeEvent(env, event);
  return jsonResponse(result.status, result.body);
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function withCors(env: Env, request: Request, resp: Response): Response {
  const origin = request.headers.get('origin') ?? '';
  const allowed = parseAllowedOrigins(env.ALLOWED_ORIGINS);
  const allowOrigin = allowed.includes('*') ? '*' : allowed.includes(origin) ? origin : '';

  const headers = new Headers(resp.headers);
  if (allowOrigin) {
    headers.set('access-control-allow-origin', allowOrigin);
    headers.set('vary', 'origin');
  }
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
  headers.set(
    'access-control-allow-headers',
    'content-type, authorization, stripe-signature, anthropic-version',
  );
  headers.set('access-control-max-age', '86400');
  // Expose our custom diagnostic headers so browser clients can read them.
  headers.set(
    'access-control-expose-headers',
    'x-amber-quota-used, x-amber-quota-limit, x-amber-tier, retry-after',
  );
  return new Response(resp.body, { status: resp.status, headers });
}

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return ['*'];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
