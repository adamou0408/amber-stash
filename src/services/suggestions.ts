import type { Item, Space, Suggestion } from '@/types';
import type { Detection, SpaceSnapshot } from '@/types/snapshot';
import { DEFAULT_METHODOLOGY } from './methodologies/default';
import { getMethodology } from './methodologies';
import { runMethodology, runShoppingPicks } from './methodologyEngine';

/**
 * 把一筆 Detection 轉成「臨時 Item」餵給既有的方法論引擎。
 * 我們不寫進 itemsStorage，只是把 snapshot 的內容貼成相容的 shape。
 */
function detectionToItem(d: Detection, spaceId: string): Item {
  return {
    id: `snapshot::${spaceId}::${d.id}`,
    name: d.name,
    category: d.category,
    quantity: d.quantity,
    photoUri: d.photoUri,
    spaceId,
    note: d.note,
    createdAt: 0,
    updatedAt: 0,
  };
}

/**
 * 把多個 snapshot 轉成 items；spaceId 帶入。
 */
function snapshotsToItems(snapshots: SpaceSnapshot[]): Item[] {
  const out: Item[] = [];
  for (const snap of snapshots) {
    for (const d of snap.detections) {
      out.push(detectionToItem(d, snap.spaceId));
    }
  }
  return out;
}

/**
 * 解析「該用什麼 items 餵給引擎」：
 *   - 對每一個空間：如果該空間有最新 snapshot → 用 snapshot 的 detections
 *   - 否則 fallback 到既有 items 列表（向後相容 M3 之前的資料）
 *
 * 為了維持純函式，呼叫方需先把 latest snapshots 撈出來傳進來。
 */
export function resolveItemsForEngine(
  items: Item[],
  spaces: Space[],
  latestSnapshotBySpace: Record<string, SpaceSnapshot | null>,
): Item[] {
  const spacesWithSnapshot = new Set(
    spaces.filter((s) => latestSnapshotBySpace[s.id]).map((s) => s.id),
  );

  const snapshotItems: Item[] = snapshotsToItems(
    spaces
      .map((s) => latestSnapshotBySpace[s.id])
      .filter((snap): snap is SpaceSnapshot => snap !== null && snap !== undefined),
  );

  // 對於「沒有 snapshot 的空間」與「未指派空間的 items」保留 fallback
  const fallbackItems = items.filter(
    (it) => !it.spaceId || !spacesWithSnapshot.has(it.spaceId),
  );

  return [...snapshotItems, ...fallbackItems];
}

export function generateSuggestions(
  items: Item[],
  spaces: Space[],
  methodologyId?: string,
  latestSnapshotBySpace: Record<string, SpaceSnapshot | null> = {},
): Suggestion[] {
  const methodology = (methodologyId && getMethodology(methodologyId)) || DEFAULT_METHODOLOGY;
  const effective = resolveItemsForEngine(items, spaces, latestSnapshotBySpace);
  return runMethodology(methodology, effective, spaces);
}

export function generateShoppingPicks(
  items: Item[],
  spaces: Space[],
  methodologyId?: string,
  latestSnapshotBySpace: Record<string, SpaceSnapshot | null> = {},
): { name: string; reason: string }[] {
  const methodology = (methodologyId && getMethodology(methodologyId)) || DEFAULT_METHODOLOGY;
  const effective = resolveItemsForEngine(items, spaces, latestSnapshotBySpace);
  return runShoppingPicks(methodology, effective, spaces);
}
