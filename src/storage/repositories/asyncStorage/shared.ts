import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 共用 JSON array 讀寫 helper —— 抽掉 5 個 storage 模組重複的
 * 「load 整陣列 → 改 → save 整陣列」樣板。行為與原本等價：解析失敗回 []。
 */

export async function loadArray<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export async function saveArray<T>(key: string, value: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
