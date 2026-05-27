import type { ShoppingItem } from '@/types';
import { repositories } from './repositories';

/**
 * Thin shim — delegate 到 repositories.shopping。
 * 保留原本 named export 介面，讓既有 screens / services 0 改動。
 */
export const loadShopping = (): Promise<ShoppingItem[]> => repositories.shopping.loadShopping();

export const addShoppingItem = (name: string, reason?: string): Promise<ShoppingItem> =>
  repositories.shopping.addShoppingItem(name, reason);

export const toggleShoppingDone = (id: string): Promise<void> =>
  repositories.shopping.toggleShoppingDone(id);

export const deleteShoppingItem = (id: string): Promise<void> =>
  repositories.shopping.deleteShoppingItem(id);
