/**
 * Shared test helpers. The vitest-pool-workers provides `env` from
 * `cloudflare:test`, which is the bindings object configured in vitest.config.ts.
 */
import { env as workerEnv } from 'cloudflare:test';
import type { Env } from '../env';

export function getEnv(overrides: Partial<Env> = {}): Env {
  return { ...(workerEnv as unknown as Env), ...overrides };
}

/** Wipe a KV namespace between tests. */
export async function clearKv(kv: KVNamespace): Promise<void> {
  // KV `list` returns at most 1000 keys per page; for tests we only ever stuff
  // a handful so one page is fine.
  const list = await kv.list();
  await Promise.all(list.keys.map((k) => kv.delete(k.name)));
}

/** Build a Request with sensible defaults for the proxy. */
export function makeRequest(
  url: string,
  init: RequestInit & { ip?: string } = {},
): Request {
  const headers = new Headers(init.headers);
  if (init.ip !== undefined) {
    headers.set('cf-connecting-ip', init.ip);
  } else if (!headers.has('cf-connecting-ip')) {
    headers.set('cf-connecting-ip', '203.0.113.1');
  }
  return new Request(url, { ...init, headers });
}
