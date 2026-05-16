/**
 * Anthropic Messages API proxy.
 *
 * Responsibilities:
 *  1. Validate the client payload (rough shape only — Anthropic does the deep
 *     validation and we want to forward future fields transparently).
 *  2. Inject `x-api-key` + `anthropic-version` headers and forward the body
 *     verbatim (including `tools`, `tool_choice`, multi-modal `content`, etc).
 *  3. Support streaming (`stream: true`) by piping the SSE body straight back
 *     to the client without buffering.
 *  4. Map upstream errors to clean JSON responses with stable shape.
 */

import { errorBody, type Env } from './env';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export interface ClaudeMessageRequest {
  model?: string;
  system?: string | unknown[];
  messages: unknown[];
  max_tokens?: number;
  tools?: unknown[];
  tool_choice?: unknown;
  stream?: boolean;
  // Forward anything else (top_p, temperature, metadata, ...) transparently.
  [key: string]: unknown;
}

export interface ValidationFailure {
  ok: false;
  status: number;
  body: ReturnType<typeof errorBody>;
}

export interface ValidationSuccess {
  ok: true;
  body: ClaudeMessageRequest;
}

export function validateClaudeRequest(raw: unknown): ValidationFailure | ValidationSuccess {
  if (!raw || typeof raw !== 'object') {
    return {
      ok: false,
      status: 400,
      body: errorBody('invalid_request_error', 'invalid_body', 'Request body must be a JSON object.'),
    };
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.messages) || obj.messages.length === 0) {
    return {
      ok: false,
      status: 400,
      body: errorBody(
        'invalid_request_error',
        'missing_messages',
        '`messages` must be a non-empty array.',
      ),
    };
  }
  if (obj.max_tokens !== undefined && typeof obj.max_tokens !== 'number') {
    return {
      ok: false,
      status: 400,
      body: errorBody('invalid_request_error', 'invalid_max_tokens', '`max_tokens` must be a number.'),
    };
  }
  if (obj.tools !== undefined && !Array.isArray(obj.tools)) {
    return {
      ok: false,
      status: 400,
      body: errorBody('invalid_request_error', 'invalid_tools', '`tools` must be an array.'),
    };
  }
  return { ok: true, body: obj as ClaudeMessageRequest };
}

export interface ForwardOptions {
  /** Inject so tests can stub fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Forward a validated request to Anthropic and return the raw Response so the
 * caller can stream it through or wrap headers. The caller owns CORS headers.
 */
export async function forwardToAnthropic(
  env: Env,
  body: ClaudeMessageRequest,
  opts: ForwardOptions = {},
): Promise<Response> {
  const fetchImpl = opts.fetchImpl ?? fetch;

  // Fill in default model if the client didn't pick one. The client *can*
  // override — we pass whatever they sent.
  const outBody: ClaudeMessageRequest = {
    ...body,
    model: body.model ?? env.ANTHROPIC_MODEL_DEFAULT,
    max_tokens: body.max_tokens ?? 2048,
  };

  let upstream: Response;
  try {
    upstream = await fetchImpl(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': env.ANTHROPIC_VERSION,
      },
      body: JSON.stringify(outBody),
    });
  } catch (err) {
    console.error('anthropic_fetch_failed', err);
    return jsonResponse(
      502,
      errorBody(
        'api_error',
        'upstream_unreachable',
        'Could not reach Anthropic API. Please retry.',
      ),
    );
  }

  // Streaming: pass the body through untouched (server-sent events).
  if (outBody.stream === true) {
    if (!upstream.ok) {
      return mapUpstreamError(upstream);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: streamingHeaders(upstream.headers),
    });
  }

  // Non-streaming: read JSON, re-emit with our own headers. We forward the
  // body bytes verbatim so the response shape (including `content[]` with
  // `tool_use` blocks) is preserved exactly.
  const text = await upstream.text();

  if (!upstream.ok) {
    return mapUpstreamError(upstream, text);
  }

  return new Response(text, {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function mapUpstreamError(upstream: Response, body?: string): Response {
  // Map Anthropic statuses to our error envelope so the client can rely on
  // a consistent shape. We deliberately don't pass through the raw body in
  // most cases — it can leak prompts or internal codes.
  if (upstream.status === 401 || upstream.status === 403) {
    console.error('anthropic_auth_failed', upstream.status, body?.slice(0, 200));
    return jsonResponse(
      500,
      errorBody(
        'api_error',
        'proxy_misconfigured',
        'Proxy is misconfigured (Anthropic auth failed). Check the worker secret.',
      ),
    );
  }
  if (upstream.status === 429) {
    return jsonResponse(
      429,
      errorBody(
        'rate_limit_error',
        'upstream_rate_limited',
        'Anthropic API rate limit hit. Please retry after a few seconds.',
      ),
    );
  }
  if (upstream.status >= 400 && upstream.status < 500) {
    // Probably a client request issue (bad model name, oversized image, etc.).
    // Surface the original message so the client can act on it.
    const detail = safeParseJson(body)?.error?.message ?? body?.slice(0, 200) ?? '';
    return jsonResponse(
      upstream.status,
      errorBody('invalid_request_error', 'upstream_rejected', detail || 'Upstream rejected request.'),
    );
  }
  console.error('anthropic_5xx', upstream.status, body?.slice(0, 200));
  return jsonResponse(
    502,
    errorBody('api_error', 'upstream_error', 'Upstream Anthropic API error.'),
  );
}

function streamingHeaders(upstream: Headers): Headers {
  const h = new Headers();
  // Anthropic sends `text/event-stream`. Pass that through plus a couple of
  // hop-by-hop hygiene headers.
  h.set('content-type', upstream.get('content-type') ?? 'text/event-stream');
  h.set('cache-control', 'no-cache');
  h.set('connection', 'keep-alive');
  return h;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

interface MaybeApiError {
  error?: { message?: string };
}

function safeParseJson(text?: string): MaybeApiError | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as MaybeApiError;
  } catch {
    return null;
  }
}
