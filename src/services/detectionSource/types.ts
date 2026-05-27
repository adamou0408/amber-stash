import type { Detection } from '@/types/snapshot';
import type { SpaceKind } from '@/types';

/**
 * DetectionSource = 抽象「一批 Detection 從哪裡來」。
 *
 * 目前有兩種來源：
 *   - camera + AI 辨識（原本的 recognizeItems 流程）
 *   - fixture（從 JSON 直接讀，給 dev / web 環境用，跳過相機）
 *
 * 之後想新增（例如：條碼掃描、上傳清單檔）只要實作這個 result 形狀即可。
 */

export type DetectionSourceBackend = 'proxy' | 'direct' | 'mock' | 'fixture';

export type DetectionSourceMeta = {
  backend: DetectionSourceBackend;
  quotaUsed?: number;
  quotaLimit?: number;
};

export type DetectionSourceResult = {
  detections: Detection[];
  /** 來源照片（fixture 沒有） */
  photoUri?: string;
  meta: DetectionSourceMeta;
};

/** 一份 fixture 對應一個「假設拍到的畫面」。 */
export type FixtureScenario = {
  id: string;
  label: string;
  description?: string;
  /** 建議搭配的空間種類；只是提示，不強制 */
  spaceKind?: SpaceKind;
  detections: Detection[];
  /**
   * 預先打包的展示照片 — Metro `require()` 出來的 asset module ID。
   * fixture picker 顯示縮圖、或載入後當 mock「剛拍到的畫面」用。
   * 沒對應照片的 scenario（例如低信心測試）可留 undefined。
   */
  photo?: number;
};
