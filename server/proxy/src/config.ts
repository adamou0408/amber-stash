/** 從 env 讀設定。敏感值（API key）只活在 server 端。 */
export type ProxyConfig = {
  anthropicApiKey: string;
  anthropicEndpoint: string;
  anthropicVersion: string;
  /** 允許的前端來源（CORS）。逗號分隔；'*' 代表全部（僅 dev 建議）。 */
  corsOrigins: string[];
  /** rate limit：時間窗（ms）內每個 client 最多幾次。 */
  rateLimitWindowMs: number;
  rateLimitMax: number;
  port: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ProxyConfig {
  return {
    anthropicApiKey: env.ANTHROPIC_API_KEY ?? '',
    anthropicEndpoint: env.ANTHROPIC_ENDPOINT ?? 'https://api.anthropic.com/v1/messages',
    anthropicVersion: env.ANTHROPIC_VERSION ?? '2023-06-01',
    corsOrigins: (env.CORS_ORIGINS ?? '*')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    rateLimitWindowMs: Number(env.RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000),
    rateLimitMax: Number(env.RATE_LIMIT_MAX ?? 30),
    port: Number(env.PORT ?? 8787),
  };
}
