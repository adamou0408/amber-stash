import uuid from 'react-native-uuid';
import type { Space } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import type { SpacesRepository } from '../types';
import { loadArray, saveArray } from './shared';

export class AsyncStorageSpacesRepository implements SpacesRepository {
  async loadSpaces(): Promise<Space[]> {
    return loadArray<Space>(STORAGE_KEYS.spaces);
  }

  private async saveAll(spaces: Space[]): Promise<void> {
    await saveArray(STORAGE_KEYS.spaces, spaces);
  }

  async addSpace(input: Omit<Space, 'id' | 'createdAt'>): Promise<Space> {
    const spaces = await this.loadSpaces();
    const space: Space = { ...input, id: String(uuid.v4()), createdAt: Date.now() };
    await this.saveAll([space, ...spaces]);
    return space;
  }

  async deleteSpace(id: string): Promise<void> {
    const spaces = await this.loadSpaces();
    await this.saveAll(spaces.filter((s) => s.id !== id));
  }
}
