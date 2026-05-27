# Amber Stash AI Proxy

自架的薄 proxy，把 **Anthropic API key 留在 server 端**，讓 client bundle 永遠不含金鑰。

## 為什麼需要它

client（`src/services/ai/config.ts`）有三層 backend 回退：`proxy` → `direct` → `mock`。
`direct` 會把 key bundle 進 client，**不適合生產**。設了 `EXPO_PUBLIC_AMBER_PROXY_URL`
指向這個 proxy，client 就走 `proxy` 模式，把 Anthropic Messages body 原樣 POST 過來，
由 proxy 注入 key 後轉發。

## 契約

- `POST /api/recognize` — body = Anthropic Messages API payload（client 原樣送）。
  proxy 注入 `x-api-key` + `anthropic-version`，轉發到 Anthropic `/v1/messages`，原樣回傳。
  **body 不被改寫**（不覆寫 model，避免換成非 vision 模型讓辨識無聲失敗）。
- `GET /health` — `{ "status": "ok" }`。
- rate limit：per-IP sliding window（濫用防護，非 per-user 配額；後者需 auth）。
- CORS：用 `CORS_ORIGINS` 限制前端來源。

## 開發

```bash
npm install
cp .env.example .env   # 填入 ANTHROPIC_API_KEY
npm run dev            # tsx watch，預設 :8787
npm test               # vitest（mock fetch，不需真實 key）
npm run typecheck
```

## 部署

`docker build -t amber-proxy .` → 由根目錄的 `docker-compose.prod.yml`（Phase 4）
與 Caddy 一起起，secrets 走 `.env.prod`。

## client 接線

在 app 根目錄設 `EXPO_PUBLIC_AMBER_PROXY_URL=https://<proxy-host>/api/recognize`，
重新 `expo export`，client 即走 proxy 模式。
