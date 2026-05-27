import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import type { ProxyConfig } from '../config.js';

function makeConfig(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  return {
    anthropicApiKey: 'sk-ant-test-key',
    anthropicEndpoint: 'https://api.anthropic.test/v1/messages',
    anthropicVersion: '2023-06-01',
    corsOrigins: ['*'],
    rateLimitWindowMs: 60_000,
    rateLimitMax: 30,
    port: 8787,
    ...overrides,
  };
}

const RECOGNIZE_BODY = JSON.stringify({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: 'sys',
  messages: [{ role: 'user', content: 'hi' }],
});

function post(app: ReturnType<typeof createApp>, body = RECOGNIZE_BODY) {
  return app.request('/api/recognize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('health', () => {
  it('returns ok', async () => {
    const res = await createApp(makeConfig()).request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});

describe('POST /api/recognize', () => {
  it('returns 500 when API key is not configured', async () => {
    const app = createApp(makeConfig({ anthropicApiKey: '' }));
    const res = await post(app);
    expect(res.status).toBe(500);
    expect(((await res.json()) as { error: string }).error).toBe('misconfigured');
  });

  it('injects server-side x-api-key + version and forwards body verbatim', async () => {
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const app = createApp(makeConfig());
    const res = await post(app);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    const [url, init] = call!;
    expect(url).toBe('https://api.anthropic.test/v1/messages');
    expect(init?.headers).toMatchObject({
      'x-api-key': 'sk-ant-test-key',
      'anthropic-version': '2023-06-01',
    });
    // body 原樣轉發
    expect(init?.body).toBe(RECOGNIZE_BODY);
  });

  it('passes through upstream non-2xx status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ type: 'error' }), { status: 429 })),
    );
    const res = await post(createApp(makeConfig()));
    expect(res.status).toBe(429);
  });

  it('returns 400 on non-JSON body', async () => {
    const app = createApp(makeConfig());
    const res = await app.request('/api/recognize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json{',
    });
    expect(res.status).toBe(400);
  });

  it('returns 502 when upstream is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }));
    const res = await post(createApp(makeConfig()));
    expect(res.status).toBe(502);
  });
});

describe('rate limiting', () => {
  it('returns 429 after exceeding the per-window max', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    const app = createApp(makeConfig({ rateLimitMax: 2 }));
    expect((await post(app)).status).toBe(200);
    expect((await post(app)).status).toBe(200);
    const third = await post(app);
    expect(third.status).toBe(429);
    expect(third.headers.get('Retry-After')).toBeTruthy();
  });
});

describe('CORS', () => {
  it('answers preflight with allow headers', async () => {
    const app = createApp(makeConfig());
    const res = await app.request('/api/recognize', {
      method: 'OPTIONS',
      headers: { Origin: 'https://app.example.com', 'Access-Control-Request-Method': 'POST' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });
});
