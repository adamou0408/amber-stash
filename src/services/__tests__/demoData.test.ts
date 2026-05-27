import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { loadDemoData, clearAllData } from '@/services/demoData';
import { STORAGE_KEYS } from '@/storage/keys';

/**
 * demoData 走 AsyncStorage v3 的 setMany/removeMany（Record / keys[] 形狀）。
 * 這支測試鎖住「載入示範資料」確實寫入、清除確實移除 —— 這條路徑在 tier-4 驗收上。
 */
beforeEach(() => {
  // @ts-expect-error — test helper exposed by mock
  AsyncStorage.__reset?.();
  // @ts-expect-error — test helper exposed by mock
  uuid.__reset?.();
});

test('loadDemoData persists spaces / items / shopping', async () => {
  const { spaces, items, shopping } = await loadDemoData();
  expect(spaces.length).toBeGreaterThan(0);
  expect(items.length).toBeGreaterThan(0);
  expect(shopping.length).toBeGreaterThan(0);

  const rawItems = await AsyncStorage.getItem(STORAGE_KEYS.items);
  expect(rawItems).not.toBeNull();
  expect((JSON.parse(rawItems as string) as unknown[]).length).toBe(items.length);
});

test('clearAllData removes the seeded keys', async () => {
  await loadDemoData();
  await clearAllData();
  expect(await AsyncStorage.getItem(STORAGE_KEYS.items)).toBeNull();
  expect(await AsyncStorage.getItem(STORAGE_KEYS.spaces)).toBeNull();
  expect(await AsyncStorage.getItem(STORAGE_KEYS.shopping)).toBeNull();
});
