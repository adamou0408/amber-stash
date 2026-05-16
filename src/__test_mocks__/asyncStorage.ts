/**
 * Minimal in-memory mock of @react-native-async-storage/async-storage for Jest.
 * Implements only the methods that this app uses.
 */
const store = new Map<string, string>();

const AsyncStorageMock = {
  async getItem(key: string): Promise<string | null> {
    return store.has(key) ? (store.get(key) as string) : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    store.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    store.delete(key);
  },
  async clear(): Promise<void> {
    store.clear();
  },
  async getAllKeys(): Promise<readonly string[]> {
    return Array.from(store.keys());
  },
  async multiGet(keys: readonly string[]): Promise<[string, string | null][]> {
    return keys.map((k) => [k, store.has(k) ? (store.get(k) as string) : null]);
  },
  async multiSet(pairs: readonly [string, string][]): Promise<void> {
    for (const [k, v] of pairs) store.set(k, v);
  },
  async multiRemove(keys: readonly string[]): Promise<void> {
    for (const k of keys) store.delete(k);
  },
  /** test helper — not part of real API */
  __reset(): void {
    store.clear();
  },
};

export default AsyncStorageMock;
