import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_METHODOLOGY } from '@/services/methodologies/default';
import type { PreferencesRepository, UserPreferences } from '../types';

const KEY = 'amberstash.preferences.v1';

const DEFAULTS: UserPreferences = {
  activeMethodologyId: DEFAULT_METHODOLOGY.id,
};

export class AsyncStoragePreferencesRepository implements PreferencesRepository {
  async loadPreferences(): Promise<UserPreferences> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    try {
      return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UserPreferences>) };
    } catch {
      return DEFAULTS;
    }
  }

  async setActiveMethodology(id: string): Promise<void> {
    const prev = await this.loadPreferences();
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...prev, activeMethodologyId: id }));
  }
}
