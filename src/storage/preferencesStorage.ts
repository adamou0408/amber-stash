import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_METHODOLOGY } from '@/services/methodologies/default';

const KEY = 'amberstash.preferences.v1';

export type UserPreferences = {
  activeMethodologyId: string;
  /** 是否已完成第一次方法論選擇（onboarding） */
  onboarded: boolean;
};

const DEFAULTS: UserPreferences = {
  activeMethodologyId: DEFAULT_METHODOLOGY.id,
  onboarded: false,
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
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({ ...prev, activeMethodologyId: id, onboarded: true }),
  );
}

export async function markOnboarded(): Promise<void> {
  const prev = await loadPreferences();
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...prev, onboarded: true }));
}
