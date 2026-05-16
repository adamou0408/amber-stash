import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * 注入 runtime 設定到 expo config 的 `extra` 欄位，client 用 Constants.expoConfig.extra 讀取。
 * 其餘設定（name / ios / android / plugins…）仍在 app.json。
 *
 * 三層 AI backend 回退：
 *   1. aiProxyUrl  — 走自架 proxy（生產環境用，可加 rate limit + 計費）
 *   2. anthropicApiKey — 直接打 Anthropic（dev / demo 用，EXPO_PUBLIC_* 會 bundle 進 client，不適合長期）
 *   3. mock — 沒設任何 key 時走假資料，dev 流程不卡關
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: {
    ...(config.extra ?? {}),
    aiProxyUrl: process.env.EXPO_PUBLIC_AMBER_PROXY_URL,
    anthropicApiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    anthropicModel: process.env.EXPO_PUBLIC_ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    freeMonthlyQuota: Number(process.env.EXPO_PUBLIC_FREE_MONTHLY_QUOTA ?? '10'),
  },
});
