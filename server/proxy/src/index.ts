import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();

if (!config.anthropicApiKey) {
  // 不 crash —— 讓 /health 仍可回應、容器能起；只是 /api/recognize 會回 500。
  console.warn('[proxy] 警告：未設 ANTHROPIC_API_KEY，/api/recognize 會回 500。');
}

const app = createApp(config);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[proxy] listening on :${info.port}（CORS: ${config.corsOrigins.join(', ')}）`);
});
