import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './keys';

export type OnboardingState = {
  completedAt: number | null;
  pickedMethodologyId: string | null;
  loadedDemo: boolean;
};

const FRESH: OnboardingState = {
  completedAt: null,
  pickedMethodologyId: null,
  loadedDemo: false,
};

export async function loadOnboarding(): Promise<OnboardingState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.onboarding);
  if (!raw) return FRESH;
  try {
    return { ...FRESH, ...(JSON.parse(raw) as Partial<OnboardingState>) };
  } catch {
    return FRESH;
  }
}

export async function saveOnboarding(patch: Partial<OnboardingState>): Promise<OnboardingState> {
  const prev = await loadOnboarding();
  const next: OnboardingState = { ...prev, ...patch };
  await AsyncStorage.setItem(STORAGE_KEYS.onboarding, JSON.stringify(next));
  return next;
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.onboarding);
}
