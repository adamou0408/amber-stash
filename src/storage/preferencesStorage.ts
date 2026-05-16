import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_METHODOLOGY } from '@/services/methodologies/default';

const KEY = 'amberstash.preferences.v1';

export type UserPreferences = {
  activeMethodologyId: string;
};

const DEFAULTS: UserPreferences = {
  activeMethodologyId: DEFAULT_METHODOLOGY.id,
};

export async function loadPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UserPreferences>) };
  } catch {
    return DEFAULTS;
  }
}

export async function setActiveMethodology(id: string): Promise<void> {
  const prev = await loadPreferences();
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...prev, activeMethodologyId: id }));
}
