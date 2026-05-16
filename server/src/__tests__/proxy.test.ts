import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleRequest } from '../index';
import { forwardToAnthropic, validateClaudeRequest } from '../proxy';
import { getEnv, clearKv, makeRequest } from './testEnv';

const SAMPLE_REQ = {
  model: 'claude-sonnet-4-5',
  max_tokens: 1024,
  system: 'You are Amber Stash.',
  messages: [
    {
      role: 'user',
      content: [{ type: 'text', text: 'hi' }],
    },
  ],
  tools: [
    {
      name: 'report_items',
      description: 'report items in the photo',
      input_schema: { type: 'object', properties: {} },
    },
  ],
  tool_choice: { type: 'tool', name: 'report_items' },
};

const SAMPLE_ANTHROPIC_RESPONSE = {
  id: 'msg_test',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: 'toolu_test',
      name: 'report_items',
      input: { detections: [{ name: 'shirt', category: 'clothing', quantity: 1, confidence: 0.9 }] },
    },
  ],
  stop_reason: 'tool_use',
  usage: { input_tokens: 100, output_tokens: 50 },
};

describe('validateClaudeRequest', () => {
  it('rejects non-object body', () => {
    const r = validateClaudeRequest(null);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(400);
      expect(r.body.error.code).toBe('invalid_body');
    }
  });

  it('rejects missing messages', () => {
    const r = validateClaudeRequest({ model: 'x' });
    expect(r.ok).toBe(false);
  });

  it('rejects non-array tools', () => {
    const r = validateClaudeRequest({ messages: [{ role: 'user', content: 'hi' }], tools: 'oops' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.body.error.code).toBe('invalid_tools');
  });

  it('accepts a valid request', () => {
    const r = validateClaudeRequest(SAMPLE_REQ);
    expect(r.ok).toBe(true);
  });
});

describe('forwardToAnthropic — header & body forwarding', () => {
  it('injects x-api-key and anthropic-version, forwards tools & tool_choice verbatim', async () => {
    const env = getEnv();
    const captured: { url: string; init: RequestInit } = { url: '', init: {} };
    const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      captured.url = String(input);
      captured.init = init ?? {};
      return new Response(JSON.stringify(SAMPLE_ANTHROPIC_RESPONSE), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const resp = await forwardToAnthropic(env, SAMPLE_REQ, { fetchImpl: fakeFetch as unknown as typeof fetch });
    expect(resp.status).toBe(200);

    expect(captured.url).toBe('https://api.anthropic.com/v1/messages');
    const sentHeaders = new Headers(captured.init.headers);
    expect(sentHeaders.get('x-api-key')).toBe(env.ANTHROPIC_API_KEY);
    expect(sentHeaders.get('anthropic-version')).toBe(env.ANTHROPIC_VERSION);

    const sentBody = JSON.parse(String(captured.init.body));
    expect(sentBody.tools).toEqual(SAMPLE_REQ.tools);
    expect(sentBody.tool_choice).toEqual(SAMPLE_REQ.tool_choice);
    expect(sentBody.system).toEqual(SAMPLE_REQ.system);
    expect(sentBody.messages).toEqual(SAMPLE_REQ.messages);
    expect(sentBody.max_tokens).toBe(SAMPLE_REQ.max_tokens);
  });

  it('fills model & max_tokens defaults when omitted', async () => {
    const env = getEnv();
    let body: Record<string, unknown> = {};
    const fakeFetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify(SAMPLE_ANTHROPIC_RESPONSE), { status: 200 });
    });

    await forwardToAnthropic(
      env,
      { messages: [{ role: 'user', content: 'hi' }] },
      { fetchImpl: fakeFetch as unknown as typeof fetch },
    );

    expect(body.model).toBe(env.ANTHROPIC_MODEL_DEFAULT);
    expect(body.max_tokens).toBe(2048);
  });

  it('preserves tool_use content blocks in the response body', async () => {
    const env = getEnv();
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify(SAMPLE_ANTHROPIC_RESPONSE), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const resp = await forwardToAnthropic(env, SAMPLE_REQ, { fetchImpl: fakeFetch as unknown as typeof fetch });
    const body = (await resp.json()) as typeof SAMPLE_ANTHROPIC_RESPONSE;
    expect(body.content[0]).toMatchObject({
      type: 'tool_use',
      name: 'report_items',
    });
    expect((body.content[0] as { input: { detections: unknown[] } }).input.detections).toHaveLength(1);
  });

  it('passes streaming body through unchanged when stream:true', async () => {
    const env = getEnv();
    const sseBody = 'event: message_start\ndata: {"foo":1}\n\n';
    const fakeFetch = vi.fn(async () =>
      new Response(sseBody, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    );
    const resp = await forwardToAnthropic(
      env,
      { ...SAMPLE_REQ, stream: true },
      { fetchImpl: fakeFetch as unknown as typeof fetch },
    );
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toBe('text/event-stream');
    expect(await resp.text()).toBe(sseBody);
  });

  it('maps upstream 401 → 500 proxy_misconfigured (key leak hiding)', async () => {
    const env = getEnv();
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: 'invalid api key' } }), { status: 401 }),
    );
    const resp = await forwardToAnthropic(env, SAMPLE_REQ, { fetchImpl: fakeFetch as unknown as typeof fetch });
    expect(resp.status).toBe(500);
    const body = (await resp.json()) as { error: { code: string } };
    expect(body.error.code).toBe('proxy_misconfigured');
  });

  it('maps upstream 429 → 429 upstream_rate_limited', async () => {
    const env = getEnv();
    const fakeFetch = vi.fn(async () => new Response('rate limited', { status: 429 }));
    const resp = await forwardToAnthropic(env, SAMPLE_REQ, { fetchImpl: fakeFetch as unknown as typeof fetch });
    expect(resp.status).toBe(429);
    const body = (await resp.json()) as { error: { code: string } };
    expect(body.error.code).toBe('upstream_rate_limited');
  });

  it('maps upstream 5xx → 502 upstream_error', async () => {
    const env = getEnv();
    const fakeFetch = vi.fn(async () => new Response('boom', { status: 503 }));
    const resp = await forwardToAnthropic(env, SAMPLE_REQ, { fetchImpl: fakeFetch as unknown as typeof fetch });
    expect(resp.status).toBe(502);
    const body = (await resp.json()) as { error: { code: string } };
    expect(body.error.code).toBe('upstream_error');
  });

  it('maps fetch throwing → 502 upstream_unreachable', async () => {
    const env = getEnv();
    const fakeFetch = vi.fn(async () => {
      throw new Error('network down');
    });
    const resp = await forwardToAnthropic(env, SAMPLE_REQ, { fetchImpl: fakeFetch as unknown as typeof fetch });
    expect(resp.status).toBe(502);
    const body = (await resp.json()) as { error: { code: string } };
    expect(body.error.code).toBe('upstream_unreachable');
  });
});

describe('POST /v1/messages — full request pipeline', () => {
  beforeEach(async () => {
    const env = getEnv();
    await clearKv(env.RATE_LIMIT_KV);
    await clearKv(env.QUOTA_KV);
    await clearKv(env.USER_TIER_KV);
  });

  it('returns 400 on invalid JSON without consuming quota', async () => {
    const env = getEnv();
    const req = makeRequest('https://proxy.example/v1/messages', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
      ip: '10.0.0.1',
    });
    const resp = await handleRequest(req, env, {
      forwardOptions: { fetchImpl: vi.fn() as unknown as typeof fetch },
    });
    expect(resp.status).toBe(400);

    // Confirm quota didn't move.
    const quotaReq = makeRequest('https://proxy.example/v1/quota', { method: 'GET', ip: '10.0.0.1' });
    const quotaResp = await handleRequest(quotaReq, env);
    const q = (await quotaResp.json()) as { used: number };
    expect(q.used).toBe(0);
  });

  it('forwards tool_use response and adds diagnostic headers', async () => {
    const env = getEnv();
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify(SAMPLE_ANTHROPIC_RESPONSE), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const req = makeRequest('https://proxy.example/v1/messages', {
      method: 'POST',
      body: JSON.stringify(SAMPLE_REQ),
      headers: { 'content-type': 'application/json' },
      ip: '10.0.0.2',
    });
    const resp = await handleRequest(req, env, {
      forwardOptions: { fetchImpl: fakeFetch as unknown as typeof fetch },
    });
    expect(resp.status).toBe(200);
    expect(resp.headers.get('x-amber-quota-used')).toBe('1');
    expect(resp.headers.get('x-amber-quota-limit')).toBe('10');
    expect(resp.headers.get('x-amber-tier')).toBe('free');

    const body = (await resp.json()) as typeof SAMPLE_ANTHROPIC_RESPONSE;
    expect(body.content[0]?.type).toBe('tool_use');
  });
});
