import type { Detection } from '@/types/snapshot';

/**
 * 純函式：審核 commit gating 邏輯。
 *
 * Spec：
 *   - confidence < 0.6 視為「低信心」
 *   - 所有低信心 detection 必須被使用者主動「確認」過（在 confirmedIds 集合）
 *   - 全部確認過後、且 list 非空 → 才能 commit
 */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

export function isLowConfidence(d: Pick<Detection, 'confidence'>): boolean {
  return d.confidence < LOW_CONFIDENCE_THRESHOLD;
}

/** 找出尚未確認的所有低信心 detection id。 */
export function pendingLowConfidence(
  detections: Detection[],
  confirmedIds: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  for (const d of detections) {
    if (!isLowConfidence(d)) continue;
    if (confirmedIds.has(d.id)) continue;
    out.push(d.id);
  }
  return out;
}

/** 是否所有低信心都被確認。 */
export function allLowConfidenceConfirmed(
  detections: Detection[],
  confirmedIds: ReadonlySet<string>,
): boolean {
  return pendingLowConfidence(detections, confirmedIds).length === 0;
}

/** Top-level：可不可以 commit。 */
export function canCommitReview(
  detections: Detection[],
  confirmedIds: ReadonlySet<string>,
): boolean {
  if (detections.length === 0) return false;
  return allLowConfidenceConfirmed(detections, confirmedIds);
}
