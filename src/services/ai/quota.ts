import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'amberstash.ai-quota.v1';

type QuotaState = {
  monthBucket: string;
  callsThisMonth: number;
};

function monthBucket(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function loadState(): Promise<QuotaState> {
  const raw = await AsyncStorage.getItem(KEY);
  const fresh: QuotaState = { monthBucket: monthBucket(), callsThisMonth: 0 };
  if (!raw) return fresh;
  try {
    const parsed = JSON.parse(raw) as QuotaState;
    if (parsed.monthBucket !== monthBucket()) return fresh;
    return parsed;
  } catch {
    return fresh;
  }
}

async function saveState(state: QuotaState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export class QuotaExceededError extends Error {
  constructor(public limit: number) {
    super(`已用完本月 ${limit} 次免費 AI 識別配額。`);
    this.name = 'QuotaExceededError';
  }
}

export async function consumeQuota(limit: number): Promise<{ used: number; limit: number }> {
  const state = await loadState();
  if (state.callsThisMonth >= limit) {
    throw new QuotaExceededError(limit);
  }
  const next: QuotaState = { ...state, callsThisMonth: state.callsThisMonth + 1 };
  await saveState(next);
  return { used: next.callsThisMonth, limit };
}

export async function getQuotaUsage(limit: number): Promise<{ used: number; limit: number }> {
  const state = await loadState();
  return { used: state.callsThisMonth, limit };
}

// Exposed for tests
export const _internal = { monthBucket, loadState, saveState };
