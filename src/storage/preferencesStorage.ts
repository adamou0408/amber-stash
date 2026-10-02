import { repositories } from './repositories';
import type { UserPreferences } from './repositories';

/**
 * Thin shim — delegate 到 repositories.preferences。
 * 保留原本 named export 介面（含 UserPreferences 型別 re-export），既有 import 0 改動。
 */
export type { UserPreferences };

export const loadPreferences = (): Promise<UserPreferences> =>
  repositories.preferences.loadPreferences();

export const setActiveMethodology = (id: string): Promise<void> =>
  repositories.preferences.setActiveMethodology(id);
