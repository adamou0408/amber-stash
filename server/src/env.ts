/**
 * Worker bindings. Keep this in sync with wrangler.toml `[vars]`, `[[kv_namespaces]]`,
 * and `wrangler secret put` calls.
 */
export interface Env {
  // Secrets (set via `wrangler secret put`)
  ANTHROPIC_API_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // Vars
  ANTHROPIC_MODEL_DEFAULT: string;
  ANTHROPIC_VERSION: string;
  FREE_MONTHLY_QUOTA: string;
  RATE_LIMIT_PER_MIN: string;
  ALLOWED_ORIGINS: string;

  // KV bindings
  QUOTA_KV: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  USER_TIER_KV: KVNamespace;
}

export type Tier = 'free' | 'paid';

/**
 * Standard JSON error response shape returned for every error path.
 * Mirrors Anthropic's error envelope so client-side code (which already handles
 * Anthropic responses in `direct` mode) doesn't need a special case.
 */
export interface ErrorBody {
  type: 'error';
  error: {
    type: string;
    code: string;
    message: string;
    /** Optional structured hint for the UI (e.g. quota info). */
    details?: Record<string, unknown>;
  };
}

export function errorBody(
  type: string,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ErrorBody {
  return { type: 'error', error: { type, code, message, ...(details ? { details } : {}) } };
}
