import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import type { Item } from '@/types';
import { STORAGE_KEYS } from './keys';

export async function loadItems(): Promise<Item[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.items);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Item[];
  } catch {
    return [];
  }
}

async function saveAll(items: Item[]) {
  await AsyncStorage.setItem(STORAGE_KEYS.items, JSON.stringify(items));
}

export async function addItem(input: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
  const items = await loadItems();
  const now = Date.now();
  const item: Item = { ...input, id: String(uuid.v4()), createdAt: now, updatedAt: now };
  await saveAll([item, ...items]);
  return item;
}

export async function updateItem(id: string, patch: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<Item | null> {
  const items = await loadItems();
  const idx = items.findIndex((it) => it.id === id);
  if (idx === -1) return null;
  const next: Item = { ...items[idx], ...patch, updatedAt: Date.now() };
  items[idx] = next;
  await saveAll(items);
  return next;
}

export async function deleteItem(id: string): Promise<void> {
  const items = await loadItems();
  await saveAll(items.filter((it) => it.id !== id));
}
