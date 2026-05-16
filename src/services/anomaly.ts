import type { ItemCategory } from '@/types';
import type { Detection, SpaceSnapshot } from '@/types/snapshot';

export type Anomaly = {
  category: ItemCategory;
  /** 上次 snapshot 同類別總數量 */
  previousQuantity: number;
  /** 本次提案同類別總數量 */
  currentQuantity: number;
  /** 倍率（current / previous）；當 previous = 0 時為 Infinity */
  ratio: number;
};

/** spec 要求 3 倍以上視為異常。 */
export const DEFAULT_ANOMALY_RATIO = 3;

/**
 * 統計 detections 內每個 category 的 quantity 總和。
 */
function tallyByCategory(detections: Detection[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of detections) {
    out[d.category] = (out[d.category] ?? 0) + d.quantity;
  }
  return out;
}

/**
 * 偵測「某類別數量 > 上次 snapshot 同類別 × ratio」。
 *
 * 純函式。
 *
 * 邊界：
 *   - previous = null → 第一次 snapshot，沒比較對象，回傳空陣列
 *   - 上次該類別 = 0、本次 > 0 → 不視為異常（從零變多通常是首次紀錄，不算重複計數）
 *   - 本次 ≤ 上次 → 不視為異常
 */
export function detectAnomalies(
  current: Detection[],
  previous: SpaceSnapshot | null,
  ratio: number = DEFAULT_ANOMALY_RATIO,
): Anomaly[] {
  if (!previous) return [];

  const prevTally = tallyByCategory(previous.detections);
  const curTally = tallyByCategory(current);

  const anomalies: Anomaly[] = [];
  for (const cat of Object.keys(curTally)) {
    const curQty = curTally[cat] ?? 0;
    const prevQty = prevTally[cat] ?? 0;
    if (prevQty <= 0) continue;
    if (curQty <= prevQty) continue;

    const r = curQty / prevQty;
    if (r > ratio) {
      anomalies.push({
        category: cat as ItemCategory,
        previousQuantity: prevQty,
        currentQuantity: curQty,
        ratio: r,
      });
    }
  }

  return anomalies;
}
