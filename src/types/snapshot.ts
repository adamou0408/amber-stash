import type { ItemCategory, UseFrequency } from './index';

/**
 * 一個 bounding box（畫面內歸一化座標 0~1，或像素皆可，呼叫方需自洽）。
 * 為了 IOU 計算與 dedup，我們只在意相對關係，所以同一個 session 內單位一致即可。
 */
export type BBox = {
  /** 左上 x */
  x: number;
  /** 左上 y */
  y: number;
  /** 寬 */
  w: number;
  /** 高 */
  h: number;
};

/** detection 的來源 — manual = 使用者手動輸入；ai = 視覺模型提案。 */
export type DetectionSource = 'manual' | 'ai';

/**
 * 單一次「看到一個東西」的 detection 提案。
 * 在 commit 成 snapshot 之前都是 session 內的暫存狀態。
 */
export type Detection = {
  id: string;
  /** 物品名稱（可由 AI 提案或使用者編輯） */
  name: string;
  /** 物品類別 */
  category: ItemCategory;
  /** 該 detection 代表的物品數量；連拍 dedup 後會合併在同一 detection 上 */
  quantity: number;
  /** 0~1 的信心值；手動輸入恆為 1 */
  confidence: number;
  /** 來源 — manual 或 ai */
  sourceType: DetectionSource;
  /** 可選的 bounding box，AI 才有 */
  bbox?: BBox;
  /** 可選的縮圖／來源照片 URI */
  photoUri?: string;
  /** 使用者備註 */
  note?: string;
  /** 收納師原則 1/5/8：使用頻率（不填代表尚未分類） */
  useFrequency?: UseFrequency;
  /** 收納師原則 5：是否在黃金區 */
  inGoldenZone?: boolean;
};

/**
 * CaptureSession：一次整理動作的暫存批次。
 * 鎖定單一空間、單一時間點。commit 後產出 snapshot。
 */
export type CaptureSession = {
  id: string;
  spaceId: string;
  startedAt: number;
  /** 已暫存的 detections（dedup 後） */
  detections: Detection[];
  /** commit 之後才有 — 紀錄哪個 snapshot 從這個 session 產生 */
  committedSnapshotId?: string;
  /** 來源照片（多張可同時加入） */
  photoUris: string[];
};

/**
 * SpaceSnapshot：該空間在 T 時刻的物品狀態 — 不可變紀錄。
 *
 * 「空間當前狀態」= 它的最新 snapshot。
 * 新增物品 = 寫一個新 snapshot 取代當前，不累加。
 *
 * 一旦寫入就視為 immutable，任何「修改」都應該寫一份新的 snapshot。
 */
export type SpaceSnapshot = {
  id: string;
  spaceId: string;
  /** 從哪個 session commit 出來 */
  sourceSessionId: string;
  /** 物品狀態 — detections 的 frozen 副本 */
  detections: Detection[];
  createdAt: number;
};
