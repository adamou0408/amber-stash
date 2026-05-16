import AsyncStorage from '@react-native-async-storage/async-storage';
import { consumeQuota, getQuotaUsage, QuotaExceededError } from '../ai/quota';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('quota tracking', () => {
  it('starts at 0 used', async () => {
    expect(await getQuotaUsage(10)).toEqual({ used: 0, limit: 10 });
  });

  it('increments on each consume', async () => {
    expect(await consumeQuota(10)).toEqual({ used: 1, limit: 10 });
    expect(await consumeQuota(10)).toEqual({ used: 2, limit: 10 });
    expect(await getQuotaUsage(10)).toEqual({ used: 2, limit: 10 });
  });

  it('throws QuotaExceededError when limit reached', async () => {
    for (let i = 0; i < 3; i++) await consumeQuota(3);
    await expect(consumeQuota(3)).rejects.toBeInstanceOf(QuotaExceededError);
    expect(await getQuotaUsage(3)).toEqual({ used: 3, limit: 3 });
  });

  it('resets when month changes', async () => {
    await consumeQuota(10);
    await consumeQuota(10);
    // simulate month change by writing a state with old month bucket
    const raw = await AsyncStorage.getItem('amberstash.ai-quota.v1');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    parsed.monthBucket = '1999-01';
    await AsyncStorage.setItem('amberstash.ai-quota.v1', JSON.stringify(parsed));

    // now reading should see the bucket mismatch and fresh-start
    expect(await getQuotaUsage(10)).toEqual({ used: 0, limit: 10 });
  });
});
