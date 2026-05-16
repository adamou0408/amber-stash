import { getAiConfig, getActiveBackend } from './config';

const ANTHROPIC_VERSION = '2023-06-01';
const DIRECT_ENDPOINT = 'https://api.anthropic.com/v1/messages';

export type ToolDefinition = {
  name: string;
  description: string;
  input_schema: object;
};

export type ImageContent = {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    data: string;
  };
};

export type TextContent = { type: 'text'; text: string };
export type UserContent = TextContent | ImageContent;

export type ClaudeRequest = {
  system: string;
  messages: { role: 'user' | 'assistant'; content: UserContent[] | string }[];
  tools?: ToolDefinition[];
  tool_choice?: { type: 'auto' | 'any' | 'tool'; name?: string };
  max_tokens?: number;
};

export type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: unknown;
};

export type TextBlock = { type: 'text'; text: string };

export type ClaudeResponse = {
  id: string;
  type: 'message';
  role: 'assistant';
  content: (ToolUseBlock | TextBlock)[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  usage: { input_tokens: number; output_tokens: number };
};

export class ClaudeApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ClaudeApiError';
  }
}

export async function callClaude(req: ClaudeRequest): Promise<ClaudeResponse> {
  const cfg = getAiConfig();
  const backend = getActiveBackend();

  if (backend === 'mock') {
    throw new ClaudeApiError(0, 'No API key or proxy configured — running in mock mode');
  }

  const url = backend === 'proxy' ? cfg.aiProxyUrl! : DIRECT_ENDPOINT;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': ANTHROPIC_VERSION,
  };
  if (backend === 'direct') {
    headers['x-api-key'] = cfg.anthropicApiKey!;
    // 在 RN 上 fetch Anthropic 需要 dangerous-direct-browser-access 旗標
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  const body = {
    model: cfg.anthropicModel,
    max_tokens: req.max_tokens ?? 2048,
    system: req.system,
    messages: req.messages,
    ...(req.tools ? { tools: req.tools } : {}),
    ...(req.tool_choice ? { tool_choice: req.tool_choice } : {}),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ClaudeApiError(res.status, `Claude API ${res.status}: ${text.slice(0, 500)}`);
  }

  return (await res.json()) as ClaudeResponse;
}
