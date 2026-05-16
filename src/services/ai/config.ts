import Constants from 'expo-constants';

type AiConfig = {
  aiProxyUrl?: string;
  anthropicApiKey?: string;
  anthropicModel: string;
  freeMonthlyQuota: number;
};

export function getAiConfig(): AiConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AiConfig>;
  return {
    aiProxyUrl: extra.aiProxyUrl,
    anthropicApiKey: extra.anthropicApiKey,
    anthropicModel: extra.anthropicModel ?? 'claude-sonnet-4-6',
    freeMonthlyQuota: extra.freeMonthlyQuota ?? 10,
  };
}

export type AiBackend = 'proxy' | 'direct' | 'mock';

export function getActiveBackend(): AiBackend {
  const cfg = getAiConfig();
  if (cfg.aiProxyUrl) return 'proxy';
  if (cfg.anthropicApiKey) return 'direct';
  return 'mock';
}
