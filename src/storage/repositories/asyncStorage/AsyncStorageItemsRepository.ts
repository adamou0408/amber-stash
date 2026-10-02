import uuid from 'react-native-uuid';
import type { Item } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import type { ItemsRepository } from '../types';
import { loadArray, saveArray } from './shared';

export class AsyncStorageItemsRepository implements ItemsRepository {
  async loadItems(): Promise<Item[]> {
    return loadArray<Item>(STORAGE_KEYS.items);
  }

  private async saveAll(items: Item[]): Promise<void> {
    await saveArray(STORAGE_KEYS.items, items);
  }

  async addItem(input: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const items = await this.loadItems();
    const now = Date.now();
    const item: Item = { ...input, id: String(uuid.v4()), createdAt: now, updatedAt: now };
    await this.saveAll([item, ...items]);
    return item;
  }

  async updateItem(
    id: string,
    patch: Partial<Omit<Item, 'id' | 'createdAt'>>,
  ): Promise<Item | null> {
    const items = await this.loadItems();
    const idx = items.findIndex((it) => it.id === id);
    if (idx === -1) return null;
    const next: Item = { ...items[idx], ...patch, updatedAt: Date.now() };
    items[idx] = next;
    await this.saveAll(items);
    return next;
  }

  async deleteItem(id: string): Promise<void> {
    const items = await this.loadItems();
    await this.saveAll(items.filter((it) => it.id !== id));
  }
}
