import type { RepositoryRegistry } from './types';
import { AsyncStorageItemsRepository } from './asyncStorage/AsyncStorageItemsRepository';
import { AsyncStorageSpacesRepository } from './asyncStorage/AsyncStorageSpacesRepository';
import { AsyncStorageShoppingRepository } from './asyncStorage/AsyncStorageShoppingRepository';
import { AsyncStorageSessionRepository } from './asyncStorage/AsyncStorageSessionRepository';
import { AsyncStoragePreferencesRepository } from './asyncStorage/AsyncStoragePreferencesRepository';

export * from './types';

/**
 * 目前的 registry — 預設全走 AsyncStorage 實作。
 * 換 Supabase 後端時，改這裡的初始化「一處」即可。
 */
let registry: RepositoryRegistry = {
  items: new AsyncStorageItemsRepository(),
  spaces: new AsyncStorageSpacesRepository(),
  shopping: new AsyncStorageShoppingRepository(),
  session: new AsyncStorageSessionRepository(),
  preferences: new AsyncStoragePreferencesRepository(),
};

/**
 * 用 Proxy getter 對外暴露 —— shim 在 module load 時解構出的 ref 仍會
 * 透過這個 Proxy 指向「最新」的 registry。否則 setRepositories() 換掉
 * registry 後，先前抓到的舊實例不會更新（測試 / 換 backend 會失效）。
 */
export const repositories: RepositoryRegistry = new Proxy({} as RepositoryRegistry, {
  get: (_target, key: string | symbol) => registry[key as keyof RepositoryRegistry],
});

/**
 * 覆寫部分或全部 repository（測試注入 / 未來換 backend 用）。
 */
export function setRepositories(overrides: Partial<RepositoryRegistry>): void {
  registry = { ...registry, ...overrides };
}
