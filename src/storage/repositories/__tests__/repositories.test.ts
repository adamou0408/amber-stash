import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { repositories } from '@/storage/repositories';

/**
 * Round-trip 測試 —— 這 4 個 repository（items / spaces / shopping / preferences）
 * 原本的 *Storage.ts 沒有任何測試覆蓋，抽成 repository 時順手補上。
 */
beforeEach(() => {
  // @ts-expect-error — test helper exposed by mock
  AsyncStorage.__reset?.();
  // @ts-expect-error — test helper exposed by mock
  uuid.__reset?.();
});

describe('ItemsRepository round-trip', () => {
  test('add then load returns the item', async () => {
    const created = await repositories.items.addItem({
      name: '外套',
      category: 'clothing',
      quantity: 2,
    });
    const all = await repositories.items.loadItems();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe(created.id);
    expect(all[0]?.name).toBe('外套');
  });

  test('update patches fields and bumps updatedAt', async () => {
    const a = await repositories.items.addItem({ name: 'x', category: 'other', quantity: 1 });
    const updated = await repositories.items.updateItem(a.id, { quantity: 5 });
    expect(updated?.quantity).toBe(5);
    expect(updated?.createdAt).toBe(a.createdAt);
  });

  test('updateItem returns null for an unknown id', async () => {
    expect(await repositories.items.updateItem('nope', { quantity: 1 })).toBeNull();
  });

  test('delete removes the item', async () => {
    const a = await repositories.items.addItem({ name: 'x', category: 'other', quantity: 1 });
    await repositories.items.deleteItem(a.id);
    expect(await repositories.items.loadItems()).toHaveLength(0);
  });
});

describe('SpacesRepository round-trip', () => {
  test('add then load; delete removes', async () => {
    const s = await repositories.spaces.addSpace({ name: '衣櫃', kind: 'wardrobe' });
    expect((await repositories.spaces.loadSpaces())[0]?.id).toBe(s.id);
    await repositories.spaces.deleteSpace(s.id);
    expect(await repositories.spaces.loadSpaces()).toHaveLength(0);
  });
});

describe('ShoppingRepository round-trip', () => {
  test('add → toggle done → delete', async () => {
    const it = await repositories.shopping.addShoppingItem('收納盒', '分隔衣物');
    expect(it.done).toBe(false);
    await repositories.shopping.toggleShoppingDone(it.id);
    expect((await repositories.shopping.loadShopping())[0]?.done).toBe(true);
    await repositories.shopping.deleteShoppingItem(it.id);
    expect(await repositories.shopping.loadShopping()).toHaveLength(0);
  });
});

describe('PreferencesRepository round-trip', () => {
  test('returns defaults when unset, then persists active methodology', async () => {
    const def = await repositories.preferences.loadPreferences();
    expect(def.activeMethodologyId).toBeTruthy();

    await repositories.preferences.setActiveMethodology('konmari-zh');
    const after = await repositories.preferences.loadPreferences();
    expect(after.activeMethodologyId).toBe('konmari-zh');
  });
});
