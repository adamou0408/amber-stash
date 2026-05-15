import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import type { ShoppingItem } from '@/types';
import { STORAGE_KEYS } from './keys';

export async function loadShopping(): Promise<ShoppingItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.shopping);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ShoppingItem[];
  } catch {
    return [];
  }
}

async function saveAll(items: ShoppingItem[]) {
  await AsyncStorage.setItem(STORAGE_KEYS.shopping, JSON.stringify(items));
}

export async function addShoppingItem(name: string, reason?: string): Promise<ShoppingItem> {
  const items = await loadShopping();
  const item: ShoppingItem = {
    id: String(uuid.v4()),
    name,
    reason,
    done: false,
    createdAt: Date.now(),
  };
  await saveAll([item, ...items]);
  return item;
}

export async function toggleShoppingDone(id: string): Promise<void> {
  const items = await loadShopping();
  const next = items.map((it) => (it.id === id ? { ...it, done: !it.done } : it));
  await saveAll(next);
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const items = await loadShopping();
  await saveAll(items.filter((it) => it.id !== id));
}
