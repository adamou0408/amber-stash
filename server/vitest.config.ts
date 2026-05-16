import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        // Use a minimal inline wrangler config so tests run without the real
        // production KV namespace IDs.
        miniflare: {
          compatibilityDate: '2024-09-23',
          compatibilityFlags: ['nodejs_compat'],
          kvNamespaces: ['QUOTA_KV', 'RATE_LIMIT_KV', 'USER_TIER_KV'],
          bindings: {
            ANTHROPIC_MODEL_DEFAULT: 'claude-sonnet-4-5',
            ANTHROPIC_VERSION: '2023-06-01',
            FREE_MONTHLY_QUOTA: '10',
            RATE_LIMIT_PER_MIN: '60',
            ALLOWED_ORIGINS: '*',
            ANTHROPIC_API_KEY: 'sk-ant-test-key',
            STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
          },
        },
      },
    },
  },
});
