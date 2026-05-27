import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ProxyConfig } from './config.js';
import { createRateLimiter } from './rateLimit.js';

/**
 * 建立 proxy app。抽成 factory 方便測試（不啟 server，用 app.request()）。
 *
 * 契約：client 端 claudeClient.ts 在 proxy 模式會把「Anthropic Messages API body」
 * 原樣 POST 到這個 endpoint（不帶 key）。proxy 只做兩件事：
 *   1. 注入 server 端的 x-api-key + anthropic-version header
 *   2. 轉發到 Anthropic /v1/messages，回傳結果
 * body 一律原樣轉發（不覆寫 model —— 換非 vision 模型會讓 recognize 無聲失敗）。
 */
export function createApp(config: ProxyConfig) {
  const app = new Hono();

  app.use(
    '*',
    cors({
      origin: config.corsOrigins.includes('*') ? '*' : config.corsOrigins,
      allowMethods: ['POST', 'GET', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'anthropic-version'],
      maxAge: 86400,
    }),
  );

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.use('/api/*', createRateLimiter({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
  }));

  app.post('/api/recognize', async (c) => {
    if (!config.anthropicApiKey) {
      return c.json(
        { error: 'misconfigured', message: 'proxy 未設定 ANTHROPIC_API_KEY。' },
        500,
      );
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'bad_request', message: 'body 必須是 JSON。' }, 400);
    }

    let upstream: Response;
    try {
      upstream = await fetch(config.anthropicEndpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': config.anthropicApiKey,
          'anthropic-version': config.anthropicVersion,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      return c.json(
        { error: 'upstream_unreachable', message: err instanceof Error ? err.message : String(err) },
        502,
      );
    }

    // 原樣回傳 Anthropic 的 status 與 JSON（含錯誤）。
    const text = await upstream.text();
    c.header('content-type', upstream.headers.get('content-type') ?? 'application/json');
    return c.body(text, upstream.status as never);
  });

  return app;
}
