import type { Space } from '@/types';
import { repositories } from './repositories';

/**
 * Thin shim — delegate 到 repositories.spaces。
 * 保留原本 named export 介面，讓既有 screens / services 0 改動。
 */
export const loadSpaces = (): Promise<Space[]> => repositories.spaces.loadSpaces();

export const addSpace = (input: Omit<Space, 'id' | 'createdAt'>): Promise<Space> =>
  repositories.spaces.addSpace(input);

export const deleteSpace = (id: string): Promise<void> => repositories.spaces.deleteSpace(id);
