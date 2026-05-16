import type { BBox, Detection } from '@/types/snapshot';

/**
 * Intersection-over-Union（兩個 bbox 的面積重疊比）。
 *
 * 0  → 完全不重疊
 * 1  → 完全重合
 *
 * 任一 bbox 寬高 ≤ 0 或聯集面積為 0 一律回 0。
 */
export function iou(a: BBox, b: BBox): number {
  if (a.w <= 0 || a.h <= 0 || b.w <= 0 || b.h <= 0) return 0;

  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);

  const interW = x2 - x1;
  const interH = y2 - y1;
  if (interW <= 0 || interH <= 0) return 0;

  const inter = interW * interH;
  const areaA = a.w * a.h;
  const areaB = b.w * b.h;
  const union = areaA + areaB - inter;
  if (union <= 0) return 0;

  return inter / union;
}

/** 預設 IOU 閾值；spec 要求 > 0.5 視為同一物。 */
export const DEFAULT_IOU_THRESHOLD = 0.5;

/**
 * 依 IOU 與類別合併重複 detections。
 *
 * 規則：
 *   - 必須同 category 才會合併
 *   - 兩者皆有 bbox 才比 IOU；IOU > threshold 視為重複
 *   - 合併時保留信心較高的那筆，數量相加，photoUri/note/bbox 沿用較高信心者
 *   - 不能合併的 detection 原樣保留
 *
 * 純函式 — 不會改動傳入的 detections 陣列。
 */
export function dedupeByIOU(
  detections: Detection[],
  threshold: number = DEFAULT_IOU_THRESHOLD,
): Detection[] {
  const merged: Detection[] = [];

  for (const cur of detections) {
    let mergedInto = false;
    for (let i = 0; i < merged.length; i++) {
      const prev = merged[i];
      if (!prev) continue;
      if (prev.category !== cur.category) continue;
      if (!prev.bbox || !cur.bbox) continue;
      if (iou(prev.bbox, cur.bbox) <= threshold) continue;

      merged[i] = mergeDetections(prev, cur);
      mergedInto = true;
      break;
    }
    if (!mergedInto) {
      merged.push({ ...cur });
    }
  }

  return merged;
}

/**
 * 合併兩筆同類別、bbox 重疊的 detection。
 * 信心較高者為主體，數量相加。
 */
export function mergeDetections(a: Detection, b: Detection): Detection {
  const primary = a.confidence >= b.confidence ? a : b;
  const secondary = primary === a ? b : a;
  return {
    id: primary.id,
    name: primary.name,
    category: primary.category,
    quantity: a.quantity + b.quantity,
    confidence: Math.max(a.confidence, b.confidence),
    sourceType: primary.sourceType,
    bbox: primary.bbox,
    photoUri: primary.photoUri ?? secondary.photoUri,
    note: primary.note ?? secondary.note,
  };
}
