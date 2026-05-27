import uuid from 'react-native-uuid';
import type { ShoppingItem } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import type { ShoppingRepository } from '../types';
import { loadArray, saveArray } from './shared';

export class AsyncStorageShoppingRepository implements ShoppingRepository {
  async loadShopping(): Promise<ShoppingItem[]> {
    return loadArray<ShoppingItem>(STORAGE_KEYS.shopping);
  }

  private async saveAll(items: ShoppingItem[]): Promise<void> {
    await saveArray(STORAGE_KEYS.shopping, items);
  }

  async addShoppingItem(name: string, reason?: string): Promise<ShoppingItem> {
    const items = await this.loadShopping();
    const item: ShoppingItem = {
      id: String(uuid.v4()),
      name,
      reason,
      done: false,
      createdAt: Date.now(),
    };
    await this.saveAll([item, ...items]);
    return item;
  }

  async toggleShoppingDone(id: string): Promise<void> {
    const items = await this.loadShopping();
    const next = items.map((it) => (it.id === id ? { ...it, done: !it.done } : it));
    await this.saveAll(next);
  }

  async deleteShoppingItem(id: string): Promise<void> {
    const items = await this.loadShopping();
    await this.saveAll(items.filter((it) => it.id !== id));
  }
}
