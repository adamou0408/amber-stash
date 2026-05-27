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
  // v3 batch API（與 @react-native-async-storage/async-storage ^3 對齊）
  async getMany(keys: readonly string[]): Promise<Record<string, string | null>> {
    const out: Record<string, string | null> = {};
    for (const k of keys) out[k] = store.has(k) ? (store.get(k) as string) : null;
    return out;
  },
  async setMany(entries: Record<string, string>): Promise<void> {
    for (const [k, v] of Object.entries(entries)) store.set(k, v);
  },
  async removeMany(keys: readonly string[]): Promise<void> {
    for (const k of keys) store.delete(k);
  },
  /** test helper — not part of real API */
  __reset(): void {
    store.clear();
  },
};

export default AsyncStorageMock;
