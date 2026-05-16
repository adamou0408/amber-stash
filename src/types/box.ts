/**
 * M7 客製收納箱型別定義。
 *
 * 設計原則：
 *  - 所有尺寸用 cm（與既有 Space 一致），體積用 L（公升）
 *  - 售價用 NT$（無小數），符合台灣市場
 *  - SKU 是不可變商品母規格，BoxOrder 是使用者實際下單的客製版
 */

import type { SpaceKind } from './index';

// ---------- 材質 ----------

/**
 * 收納箱材質。
 *
 * 木材三選一（樺木 / 胡桃木 / 橡木）— 主打雷雕質感；
 * 牛皮紙 — 季節性 / 環保訴求；
 * 透明 PP — 視覺化內容物；
 * 不織布 — 摺疊 / 衣物用。
 */
export type BoxMaterial =
  | 'wood_birch'
  | 'wood_walnut'
  | 'wood_oak'
  | 'kraft_paper'
  | 'clear_pp'
  | 'non_woven';

export const BOX_MATERIAL_LABEL: Record<BoxMaterial, string> = {
  wood_birch: '樺木',
  wood_walnut: '胡桃木',
  wood_oak: '橡木',
  kraft_paper: '牛皮紙',
  clear_pp: '透明 PP',
  non_woven: '不織布',
};

/**
 * 哪些材質支援雷雕。
 * 牛皮紙與不織布不適合雷雕（會燒穿或邊緣毛邊）。
 */
export const ENGRAVABLE_MATERIALS: ReadonlySet<BoxMaterial> = new Set<BoxMaterial>([
  'wood_birch',
  'wood_walnut',
  'wood_oak',
  'clear_pp',
]);

// ---------- 尺寸 / 雷雕區 ----------

/**
 * 三軸尺寸（cm）。
 *
 * 不同於 Space.widthCm 等三個獨立欄位 — 這裡封裝在一個 object 內，
 * 因為 SKU 內外尺寸與雷雕區尺寸都會用到「三軸 + 重複出現」。
 */
export type BoxDimensions = {
  /** 寬（cm） */
  widthCm: number;
  /** 高（cm） */
  heightCm: number;
  /** 深（cm） */
  depthCm: number;
};

/**
 * 雷雕區域定義 — 通常落在箱蓋或正面。
 * widthCm × heightCm 為雷雕可用範圍；
 * surface 標示貼在哪一面，方便預覽。
 */
export type EngravingArea = {
  widthCm: number;
  heightCm: number;
  surface: 'lid' | 'front' | 'side';
};

// ---------- SKU ----------

/**
 * BoxSku：商品母規格 — 不會因為單筆訂單而改變。
 *
 * 命名規則：`box-<size>-<material>-<n>`（catalog 內保證唯一）。
 *
 * 設計取捨：
 *  - 「內尺寸」一定小於「外尺寸」（壁厚）— catalog test 會驗
 *  - 「容量 L」= 內尺寸三軸 (cm) 相乘 / 1000，向下取一位小數
 *  - 雷雕區域必須小於箱蓋的對應面（雷雕區由 catalog 定義時就確保 fit）
 */
export type BoxSku = {
  /** SKU 編號 — kebab-case，全域唯一 */
  id: string;
  /** 中文顯示名稱（建議「材質 + 用途」） */
  name: string;
  /** 材質 */
  material: BoxMaterial;
  /** 外尺寸 — 用於空間 fit 驗證 */
  exterior: BoxDimensions;
  /** 內尺寸 — 用於物品 fit 驗證 */
  interior: BoxDimensions;
  /** 容量（公升）；可由 interior 推導，但 catalog 預先算好讓推薦更快 */
  capacityL: number;
  /** 雷雕區尺寸與位置 */
  engravingArea: EngravingArea;
  /** 建議零售價 NT$（無小數） */
  priceTwd: number;
  /** 「適合哪些空間種類」— 推薦器篩選用 */
  suitableSpaceKinds: SpaceKind[];
  /** 「適合哪些物品類別」— 推薦器排序用 */
  suitableCategories: string[];
  /** 一行簡述 — 給未來 UI 卡片用 */
  tagline: string;
};

// ---------- 訂單 ----------

/**
 * 訂單狀態 — 線性流轉：
 *   draft → placed → in_production → shipped → delivered
 *   cancelled 可以從前 3 個狀態任意進入；shipped/delivered 後不可取消（已寄出）。
 */
export type BoxOrderStatus =
  | 'draft'
  | 'placed'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const BOX_ORDER_STATUS_LABEL: Record<BoxOrderStatus, string> = {
  draft: '草稿',
  placed: '已下單',
  in_production: '製作中',
  shipped: '已出貨',
  delivered: '已到貨',
  cancelled: '已取消',
};

/**
 * 訂單狀態時間戳 — 每個狀態進入時間皆記錄（Unix epoch ms）。
 */
export type BoxOrderTimestamps = {
  createdAt: number;
  placedAt?: number;
  inProductionAt?: number;
  shippedAt?: number;
  deliveredAt?: number;
  cancelledAt?: number;
};

/**
 * BoxOrder：使用者實際下單記錄。
 *
 * - `spaceId` 連結到 Space（box 是為哪個空間客製的）— 出貨後 QR 一掃跳該空間頁面
 * - `engravingText` 是雷雕字（通常 = 空間名稱，但使用者可修改）
 * - `engravingQrPayload` 是雷雕 QR 內容（通常 = amberstash://space/<id>）
 * - `quantity` 此次訂的件數（同 SKU 多個）
 */
export type BoxOrder = {
  id: string;
  spaceId: string;
  skuId: string;
  quantity: number;
  /** 雷雕字（已 trim、長度合法） */
  engravingText: string;
  /** 雷雕 QR Code payload；通常是 deep link */
  engravingQrPayload: string;
  status: BoxOrderStatus;
  timestamps: BoxOrderTimestamps;
  /** 物流追蹤號（shipped 後填入） */
  trackingNumber?: string;
  /** 內部備註（出貨給工廠時用） */
  note?: string;
  /** 單價快照 — 訂單成立當下的售價（之後 SKU 改價不影響歷史單） */
  unitPriceTwdSnapshot: number;
};

/**
 * 雷雕字長度上限 — 大尺寸箱也只 12 字，避免字太擠。
 * UI 端輸入可在此提示，service 端也會驗證。
 */
export const MAX_ENGRAVING_TEXT_LENGTH = 12;
