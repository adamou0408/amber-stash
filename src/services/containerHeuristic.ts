import type { Detection } from '@/types/snapshot';
import type { ItemCategory } from '@/types';

/**
 * 「container」= 可能裝著其他物品的容器（收納盒、箱、籃、籐籃…）。
 *
 * 偵測規則：
 *   - category 必須是 `tools` 或 `other`（這兩類最常被誤標成容器）
 *   - name 含關鍵字「盒」「箱」「籃」「籮」「筐」之一
 *
 * 純函式 — 不依賴 React / RN。
 */
const CONTAINER_KEYWORDS = ['盒', '箱', '籃', '籮', '筐'] as const;

const CONTAINER_CATEGORIES = new Set<ItemCategory>(['tools', 'other']);

/**
 * 單一 detection 是否疑似容器。
 */
export function isContainerCandidate(detection: Pick<Detection, 'name' | 'category'>): boolean {
  if (!CONTAINER_CATEGORIES.has(detection.category)) return false;
  const name = detection.name ?? '';
  return CONTAINER_KEYWORDS.some((kw) => name.includes(kw));
}

/**
 * 從一組 detections 中挑出第一個疑似容器。沒有則回 null。
 *
 * 之所以挑「第一個」：在 review flow 中我們希望逐一處理，避免同時跳多個對話。
 */
export function pickContainerCandidate(detections: Detection[]): Detection | null {
  for (const d of detections) {
    if (isContainerCandidate(d)) return d;
  }
  return null;
}

/**
 * 「只算容器」分支 — 在 note 上加「(容器)」標記、不影響其他欄位。
 * 如果 note 已含標記則不會重複加。
 */
export function markAsContainerOnly(detection: Detection): Detection {
  const tag = '(容器)';
  const existing = detection.note?.trim() ?? '';
  if (existing.includes(tag)) return detection;
  const nextNote = existing.length === 0 ? tag : `${existing} ${tag}`;
  return { ...detection, note: nextNote };
}

export const CONTAINER_KEYWORD_LIST: readonly string[] = CONTAINER_KEYWORDS;
