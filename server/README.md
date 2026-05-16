# Amber Stash · Anthropic API Proxy

A Cloudflare Worker that sits between the Amber Stash RN app and the Anthropic
Messages API. It exists so we can:

- Hide the Anthropic API key (never ship it in an `EXPO_PUBLIC_*` bundled var)
- Enforce per-user rate limits (currently IP-derived; swap to authed user later)
- Enforce a monthly call quota (free = 10/mo, paid = unlimited)
- Receive Stripe subscription webhooks to flip a user between `free` and `paid`

The proxy is a pure pass-through for the Anthropic Messages API: the request
body (including `tools`, `tool_choice`, multimodal `content`, etc.) is forwarded
verbatim and the response body is preserved exactly. Streaming (`stream: true`)
is supported.

---

## Layout

```
server/
├── package.json
├── wrangler.toml          # Worker config (KV bindings, vars)
├── tsconfig.json
├── vitest.config.ts
├── .dev.vars.example      # Copy → .dev.vars for `wrangler dev`
├── src/
│   ├── index.ts           # Worker entry + routes
│   ├── proxy.ts           # Anthropic forwarder (streaming-safe)
│   ├── rateLimit.ts       # Sliding-window via KV
│   ├── quota.ts           # Monthly quota + tier lookup
│   ├── stripe.ts          # Webhook signature verify + tier writes
│   ├── userId.ts          # IP/Bearer → stable user id
│   └── env.ts             # Env / error-envelope types
└── src/__tests__/
    ├── proxy.test.ts
    ├── rateLimit.test.ts
    ├── quota.test.ts
    └── stripe.test.ts
```

The server is its own npm package; it does NOT pollute the root RN
`package.json` with Worker tooling. Install deps with `cd server && npm install`.

---

## Routes

| Method | Path                  | Purpose                                              |
| ------ | --------------------- | ---------------------------------------------------- |
| POST   | `/v1/messages`        | Forward to `api.anthropic.com/v1/messages`           |
| POST   | `/v1/stripe/webhook`  | Stripe subscription events → `USER_TIER_KV`          |
| GET    | `/v1/quota`           | Current user's tier + usage for the current month    |
| GET    | `/health`             | Liveness probe                                       |

Error envelope is consistent across every route:

```json
{
  "type": "error",
  "error": {
    "type": "rate_limit_error",
    "code": "too_many_requests",
    "message": "Too many requests. Try again in 12s.",
    "details": { "retryAfterSec": 12, "limit": 60 }
  }
}
```

Diagnostic response headers on `POST /v1/messages`:

- `x-amber-quota-used` — the user's monthly count after this call
- `x-amber-quota-limit` — numeric, or `unlimited` for paid
- `x-amber-tier` — `free` | `paid`
- `retry-after` (on 429) — seconds to back off

---

## Local development

### 1. Install

```bash
cd server
npm install
```

### 2. Configure local secrets

```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars and paste a real ANTHROPIC_API_KEY and (optionally) STRIPE_WEBHOOK_SECRET
```

`.dev.vars` is git-ignored. Wrangler picks it up automatically on `wrangler dev`.

### 3. Run

```bash
npx wrangler dev
```

This starts a local Worker on `http://127.0.0.1:8787` with in-memory KV.

### 4. Smoke test

```bash
# Quota probe
curl http://127.0.0.1:8787/v1/quota

# Messages call
curl -X POST http://127.0.0.1:8787/v1/messages \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"hi"}],"max_tokens":64}'
```

### 5. Tests

```bash
npm test
```

Tests run under `@cloudflare/vitest-pool-workers`, which boots a real
miniflare instance with isolated KV namespaces. No live Anthropic / Stripe
calls — both are stubbed.

---

## Deploying to Cloudflare

### 1. Auth

```bash
npx wrangler login
```

### 2. Create the KV namespaces (one-time)

```bash
npx wrangler kv namespace create QUOTA_KV
npx wrangler kv namespace create RATE_LIMIT_KV
npx wrangler kv namespace create USER_TIER_KV
```

Each command prints an `id = "abc123..."`. Paste each into the matching
`[[kv_namespaces]]` block in `wrangler.toml`, replacing the
`kv_namespace_id_placeholder_*` strings.

### 3. Set secrets

```bash
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

These are stored encrypted in Cloudflare and never appear in the source.

### 4. Dry-run + deploy

```bash
# Verify the build without publishing
npm run deploy:dry-run

# Ship it
npm run deploy
```

The first deploy returns a `*.workers.dev` URL. Add a custom domain through the
Cloudflare dashboard if you want `api.amberstash.com`.

### 5. Tail logs

```bash
npx wrangler tail
```

---

## Pointing the RN app at the proxy

The RN app already supports a `proxy` backend (`src/services/ai/claudeClient.ts`);
no code changes needed. Just set the env var:

```bash
# In the project root .env
EXPO_PUBLIC_AMBER_PROXY_URL=https://amber-stash-proxy.<account>.workers.dev/v1/messages
```

`getActiveBackend()` will pick `proxy` when `aiProxyUrl` is set. The
client posts the same `{system, messages, tools, tool_choice, max_tokens}` body
the proxy expects.

**Streaming note:** the proxy supports streaming when the client passes
`stream: true`, but the current RN client (`callClaude`) only uses one-shot
responses (it `await res.json()`). That's fine — leave `stream` off until the
RN side adds an SSE consumer. The proxy is ready when you are.

---

## Stripe webhook setup

### Production

1. Stripe Dashboard → Developers → Webhooks → "Add endpoint"
2. URL: `https://<your-worker-domain>/v1/stripe/webhook`
3. Events to send: `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the signing secret (`whsec_...`) and set it on the Worker:
   `npx wrangler secret put STRIPE_WEBHOOK_SECRET`

### Local dev with `stripe-cli`

```bash
# Forward Stripe events to your local Worker
stripe listen --forward-to http://127.0.0.1:8787/v1/stripe/webhook
# The CLI prints a `whsec_...` — paste it into .dev.vars as STRIPE_WEBHOOK_SECRET
# In another shell, trigger an event:
stripe trigger customer.subscription.created
```

The handler expects the subscription object to carry `metadata.userId` (the
internal user id our proxy uses). Set this when you create the Stripe
Checkout session or subscription on the client.

> Note: the proxy intentionally does NOT implement the Stripe checkout flow.
> That belongs on the client (or a separate function). The proxy only consumes
> the webhook.

---

## Operational notes

- **KV eventual consistency:** counters can briefly under/over-count by ~1
  across regions. For a vision call API that's acceptable. If abuse becomes
  an issue, port `rateLimit` / `quota` to Durable Objects.
- **Cost:** each `/v1/messages` call does ~2 KV reads + 2 KV writes. KV pricing
  is generous; this should sit well within the free tier for early-stage usage.
- **Privacy:** we never log the request body. Errors log only status codes and
  short truncated upstream messages. Don't add prompt-logging without a privacy
  review.
- **CORS:** `ALLOWED_ORIGINS` defaults to `*`. For production, set it to the
  comma-separated list of frontend origins that may call the proxy.

---

## What you still need to do as the operator

1. Create the Cloudflare account + run `wrangler login`
2. Create the 3 KV namespaces and paste their IDs into `wrangler.toml`
3. `wrangler secret put ANTHROPIC_API_KEY` and `STRIPE_WEBHOOK_SECRET`
4. (Stripe) create a webhook endpoint pointing at the deployed URL
5. (Optional) custom domain via Cloudflare dashboard
6. Set `EXPO_PUBLIC_AMBER_PROXY_URL` in the RN app `.env`
