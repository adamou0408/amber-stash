import type { Item } from '@/types';
import { repositories } from './repositories';

/**
 * Thin shim — delegate 到 repositories.items。
 * 保留原本 named export 介面，讓既有 screens / services 0 改動。
 */
export const loadItems = (): Promise<Item[]> => repositories.items.loadItems();

export const addItem = (input: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> =>
  repositories.items.addItem(input);

export const updateItem = (
  id: string,
  patch: Partial<Omit<Item, 'id' | 'createdAt'>>,
): Promise<Item | null> => repositories.items.updateItem(id, patch);

export const deleteItem = (id: string): Promise<void> => repositories.items.deleteItem(id);
