import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import type { Space } from '@/types';
import { STORAGE_KEYS } from './keys';

export async function loadSpaces(): Promise<Space[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.spaces);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Space[];
  } catch {
    return [];
  }
}

async function saveAll(spaces: Space[]) {
  await AsyncStorage.setItem(STORAGE_KEYS.spaces, JSON.stringify(spaces));
}

export async function addSpace(input: Omit<Space, 'id' | 'createdAt'>): Promise<Space> {
  const spaces = await loadSpaces();
  const space: Space = { ...input, id: String(uuid.v4()), createdAt: Date.now() };
  await saveAll([space, ...spaces]);
  return space;
}

export async function deleteSpace(id: string): Promise<void> {
  const spaces = await loadSpaces();
  await saveAll(spaces.filter((s) => s.id !== id));
}
