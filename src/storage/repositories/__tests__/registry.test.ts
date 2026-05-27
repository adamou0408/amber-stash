import { repositories, setRepositories, type ItemsRepository } from '@/storage/repositories';
import { loadItems } from '@/storage/itemsStorage';
import type { Item } from '@/types';

/**
 * 鎖住兩件事：
 *   1. Proxy getter 生效 —— setRepositories() 換掉 registry 後，shim 仍指向最新實作
 *   2. 未來換 backend / 注入測試 double 的能力（Supabase migration 依賴這個 seam）
 */
describe('repository registry', () => {
  const original = repositories.items;

  afterEach(() => {
    setRepositories({ items: original });
  });

  test('setRepositories override is reflected through the storage shim', async () => {
    const sentinel: Item[] = [
      { id: 'fake', name: 'sentinel', category: 'other', quantity: 1, createdAt: 0, updatedAt: 0 },
    ];
    const fake: ItemsRepository = {
      loadItems: async () => sentinel,
      addItem: async () => {
        throw new Error('not used');
      },
      updateItem: async () => null,
      deleteItem: async () => {},
    };

    setRepositories({ items: fake });

    // 經 shim（itemsStorage.loadItems）呼叫，而非直接打 registry —
    // 證明 module-load 時解構的 ref 透過 Proxy 看到最新 registry。
    const out = await loadItems();
    expect(out).toBe(sentinel);
  });

  test('override is scoped — restoring brings back the real repository', async () => {
    setRepositories({ items: original });
    // 還原後不再回 sentinel（real repo 在乾淨 mock 下回 []）
    const out = await loadItems();
    expect(out).not.toContainEqual(expect.objectContaining({ name: 'sentinel' }));
  });
});
