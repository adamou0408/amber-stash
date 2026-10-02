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
   * 此 scenario 對應的展示照片變化池（Unsplash CDN base URL，無 query string）。
   * fixture picker 每次打開會從這個 pool 隨機抽一張當代表照片。
   * `pickPhotoUrl(scenario)` helper 會挑一張並補上尺寸 query string。
   */
  photos: string[];
  /**
   * listFixtures() 回傳時，這次抽中的代表照片完整 URL（含 query string）。
   * Modal 縮圖跟載入後 photoBox 顯示同一張，保持視覺一致。
   * 沒對應照片的 scenario 為 undefined。
   */
  pickedPhotoUrl?: string;
};
