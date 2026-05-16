/**
 * Identifies the calling user. Today this is an IP-derived hash (CF connecting
 * IP from `cf-connecting-ip` / `x-forwarded-for`) so we have something stable
 * before real auth ships.
 *
 * When auth is added, just replace this with `Authorization: Bearer <jwt>` →
 * userId mapping; every caller of `getUserId` is fine.
 */
export async function getUserId(request: Request): Promise<string> {
  // Prefer an explicit Authorization bearer token if the client sends one.
  // This lets future authed clients work without changing the rest of the code.
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    if (token.length > 0) {
      return `u_${await sha256Hex(token)}`;
    }
  }

  const ip = clientIp(request);
  return `ip_${await sha256Hex(ip)}`;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(buf);
  // Truncate to 16 hex chars (64 bits) — plenty of entropy for a per-user
  // bucket, keeps KV keys small.
  let hex = '';
  for (let i = 0; i < 8; i++) {
    hex += (bytes[i] ?? 0).toString(16).padStart(2, '0');
  }
  return hex;
}
