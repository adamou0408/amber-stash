import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_METHODOLOGY } from '@/services/methodologies/default';
import {
  defaultOneInOneOutState,
  nextOneInOneOutState,
  type OneInOneOutState,
} from '@/services/oneInOneOutDamper';
import type { ItemCategory, UseFrequency } from '@/types';

const KEY = 'amberstash.preferences.v1';

export type UserPreferences = {
  activeMethodologyId: string;
  /** 是否已完成第一次方法論選擇（onboarding） */
  onboarded: boolean;
  /**
   * 上次新增物品時用的欄位 — 用作下次預設值，省點擊。
   * 連續錄入時這幾欄會「黏住」，使用者只改物品名稱即可。
   */
  lastCategory?: ItemCategory;
  lastSpaceId?: string;
  lastUseFrequency?: UseFrequency;
  /**
   * 「一進一出」banner 顯示頻率動態降低器的 state — 詳見 oneInOneOutDamper.ts
   */
  oneInOneOut: OneInOneOutState;
};

const DEFAULTS: UserPreferences = {
  activeMethodologyId: DEFAULT_METHODOLOGY.id,
  onboarded: false,
  oneInOneOut: defaultOneInOneOutState(),
};

export async function loadPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      ...DEFAULTS,
      ...parsed,
      // 保證 oneInOneOut 一定是完整物件（舊資料可能沒有此欄位）
      oneInOneOut: { ...defaultOneInOneOutState(), ...(parsed.oneInOneOut ?? {}) },
    };
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

/**
 * 記住「上次用了什麼」— 下次開 AddItem 自動套用，省點擊。
 * 接受 partial，未填的欄位不會覆蓋舊值。
 */
export async function rememberLastUsed(patch: {
  category?: ItemCategory;
  spaceId?: string;
  useFrequency?: UseFrequency;
}): Promise<void> {
  const prev = await loadPreferences();
  const next: UserPreferences = {
    ...prev,
    lastCategory: patch.category ?? prev.lastCategory,
    lastSpaceId: patch.spaceId ?? prev.lastSpaceId,
    lastUseFrequency: patch.useFrequency ?? prev.lastUseFrequency,
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

/**
 * 記錄一次 commit 是否實際顯示了「一進一出」banner — 更新 damper 計數。
 */
export async function recordOneInOneOut(wasShown: boolean): Promise<void> {
  const prev = await loadPreferences();
  const next: UserPreferences = {
    ...prev,
    oneInOneOut: nextOneInOneOutState(prev.oneInOneOut, wasShown),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

