import type { Item, Space, ShoppingItem } from '@/types';
import type { CaptureSession, Detection, SpaceSnapshot } from '@/types/snapshot';

/**
 * Repository 抽象層 — 把「資料怎麼存」與「誰在用資料」解耦。
 *
 * 目前唯一實作是 AsyncStorage（見 ./asyncStorage/*）。未來接 Supabase 只要
 * 新增 Supabase*Repository 並在 index.ts 換掉 registry 初始化「一處」即可。
 *
 * 設計約束：
 *   - method 簽章對齊原本的 *Storage.ts named function（screens 走 shim 0 改動）
 *   - 全部 async（對齊現況也對齊遠端後端）
 *   - 複合操作（addDetectionToSession / commitSnapshot / loadLatestSnapshotMap）
 *     保留為 repository method，不拆成 caller orchestration —— 這是日後 Supabase
 *     把 transaction / 查詢集中在實作內可控的關鍵。
 */

/** 使用者偏好。原本定義在 preferencesStorage.ts，移到這裡當共用 domain 型別。 */
export type UserPreferences = {
  activeMethodologyId: string;
};

export interface ItemsRepository {
  loadItems(): Promise<Item[]>;
  addItem(input: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item>;
  updateItem(id: string, patch: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<Item | null>;
  deleteItem(id: string): Promise<void>;
}

export interface SpacesRepository {
  loadSpaces(): Promise<Space[]>;
  addSpace(input: Omit<Space, 'id' | 'createdAt'>): Promise<Space>;
  deleteSpace(id: string): Promise<void>;
}

export interface ShoppingRepository {
  loadShopping(): Promise<ShoppingItem[]>;
  addShoppingItem(name: string, reason?: string): Promise<ShoppingItem>;
  toggleShoppingDone(id: string): Promise<void>;
  deleteShoppingItem(id: string): Promise<void>;
}

export interface SessionRepository {
  loadSessions(): Promise<CaptureSession[]>;
  loadSnapshots(): Promise<SpaceSnapshot[]>;
  createSession(spaceId: string): Promise<CaptureSession>;
  getSession(sessionId: string): Promise<CaptureSession | null>;
  updateSession(
    sessionId: string,
    patch: Partial<Omit<CaptureSession, 'id' | 'startedAt'>>,
  ): Promise<CaptureSession | null>;
  deleteSession(sessionId: string): Promise<void>;
  addDetectionToSession(sessionId: string, detection: Detection): Promise<CaptureSession | null>;
  loadSnapshotsForSpace(spaceId: string): Promise<SpaceSnapshot[]>;
  loadLatestSnapshotForSpace(spaceId: string): Promise<SpaceSnapshot | null>;
  loadLatestSnapshotMap(spaceIds: string[]): Promise<Record<string, SpaceSnapshot | null>>;
  commitSnapshot(sessionId: string): Promise<SpaceSnapshot | null>;
}

export interface PreferencesRepository {
  loadPreferences(): Promise<UserPreferences>;
  setActiveMethodology(id: string): Promise<void>;
}

export interface RepositoryRegistry {
  items: ItemsRepository;
  spaces: SpacesRepository;
  shopping: ShoppingRepository;
  session: SessionRepository;
  preferences: PreferencesRepository;
}
