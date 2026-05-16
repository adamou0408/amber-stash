import type { BBox } from '@/types/snapshot';

/**
 * Bbox 數學 — 純函式部分，方便單元測試。
 *
 * 座標系：detection.bbox 是 0~1 歸一化（相對於原圖）。
 * UI 顯示時需轉成 px。拖拉編輯時 px 又要轉回 0~1。
 */

export type PxRect = { x: number; y: number; w: number; h: number };

/**
 * 把歸一化的 bbox 轉成 px rect。
 * 若 bbox 超出 [0,1] 我們仍允許輸出（給 UI clamp，不在這層擋掉，避免改動原始資料）。
 */
export function normalizedToPx(bbox: BBox, containerW: number, containerH: number): PxRect {
  return {
    x: bbox.x * containerW,
    y: bbox.y * containerH,
    w: bbox.w * containerW,
    h: bbox.h * containerH,
  };
}

/**
 * 把 px rect 轉回歸一化 bbox，並 clamp 在 [0,1]。
 * 容器尺寸為 0 時回 zero-sized bbox（避免除以 0）。
 */
export function pxToNormalized(rect: PxRect, containerW: number, containerH: number): BBox {
  if (containerW <= 0 || containerH <= 0) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  return {
    x: clamp01(rect.x / containerW),
    y: clamp01(rect.y / containerH),
    w: clamp01(rect.w / containerW),
    h: clamp01(rect.h / containerH),
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Corner handle 名稱。
 *   - tl = top-left, tr = top-right, bl = bottom-left, br = bottom-right
 */
export type Corner = 'tl' | 'tr' | 'bl' | 'br';

/**
 * 根據某 corner 被拖到新 (px) 位置，回算出新 bbox（歸一化）。
 *
 * 邏輯：把該 corner 移到 (cornerX, cornerY)，其他三角保持原本位置。
 * 若 corner 跨過對角線（讓 w/h 變負），自動翻轉並回正。
 *
 * 純函式 — 不依賴任何 React 內部。
 */
export function resizeBboxFromCorner(
  bbox: BBox,
  corner: Corner,
  cornerX: number,
  cornerY: number,
  containerW: number,
  containerH: number,
): BBox {
  if (containerW <= 0 || containerH <= 0) return bbox;

  // 把 bbox 轉到 px 空間操作
  const cur = normalizedToPx(bbox, containerW, containerH);
  let left = cur.x;
  let top = cur.y;
  let right = cur.x + cur.w;
  let bottom = cur.y + cur.h;

  switch (corner) {
    case 'tl':
      left = cornerX;
      top = cornerY;
      break;
    case 'tr':
      right = cornerX;
      top = cornerY;
      break;
    case 'bl':
      left = cornerX;
      bottom = cornerY;
      break;
    case 'br':
      right = cornerX;
      bottom = cornerY;
      break;
  }

  // 翻轉處理：若使用者把 corner 拖過對邊，互換
  if (right < left) [left, right] = [right, left];
  if (bottom < top) [top, bottom] = [bottom, top];

  // clamp 到容器內
  left = Math.max(0, Math.min(containerW, left));
  right = Math.max(0, Math.min(containerW, right));
  top = Math.max(0, Math.min(containerH, top));
  bottom = Math.max(0, Math.min(containerH, bottom));

  const next: PxRect = {
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
  };

  return pxToNormalized(next, containerW, containerH);
}

/**
 * 平移整個 bbox（拖框體本身、不是 corner）— 內部數量會保持，只移動左上角。
 * dx/dy 為 px 位移；自動 clamp 不出框。
 */
export function translateBbox(
  bbox: BBox,
  dxPx: number,
  dyPx: number,
  containerW: number,
  containerH: number,
): BBox {
  if (containerW <= 0 || containerH <= 0) return bbox;
  const cur = normalizedToPx(bbox, containerW, containerH);

  // 確保不會推出容器外
  const maxLeft = containerW - cur.w;
  const maxTop = containerH - cur.h;
  const nextLeft = Math.max(0, Math.min(maxLeft, cur.x + dxPx));
  const nextTop = Math.max(0, Math.min(maxTop, cur.y + dyPx));

  return pxToNormalized(
    { x: nextLeft, y: nextTop, w: cur.w, h: cur.h },
    containerW,
    containerH,
  );
}

/**
 * 顏色 token：根據 confidence 決定 bbox 框色。
 *   - >= 0.6 → 琥珀色（高信心）
 *   - <  0.6 → 紅色（低信心）
 */
export function bboxStrokeForConfidence(
  confidence: number,
  highColor: string,
  lowColor: string,
): string {
  return confidence >= 0.6 ? highColor : lowColor;
}
