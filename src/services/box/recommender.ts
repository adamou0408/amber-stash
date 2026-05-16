/**
 * 箱規推薦演算法。
 *
 * 給定一個 Space（含尺寸）+ 物品清單 → 推薦 1-3 個 SKU 組合。
 *
 * 演算法分為四步：
 *   1. 估算物品總體積（按 category 標準折疊體積）
 *   2. 過濾出尺寸進得去該空間的 SKU（外尺寸 ≤ 空間 80%）
 *   3. 對每個候選 SKU 計算（覆蓋率、容量比、價格、材質一致性）
 *   4. 依加權分數排序，回傳前 3 名
 *
 * 純函式 — 不讀 storage，所有輸入由呼叫端準備好。
 */

import type { Item, ItemCategory, Space, SpaceKind } from '@/types';
import type { BoxSku } from '@/types/box';
import { MAX_ENGRAVING_TEXT_LENGTH } from '@/types/box';
import { BOX_CATALOG } from './catalog';

// ---------- 體積估算 ----------

/**
 * 每件物品的「估算折疊體積」(L) — 按類別取保守中值。
 *
 * 來源：常見市售收納指南 + 觀察整理師建議；
 * 衣物以「捲折好」為基準，書以「精裝中型」為基準。
 */
export const PER_ITEM_VOLUME_L: Record<ItemCategory, number> = {
  clothing: 1.2, // 一件捲折好衣物（毛衣偏 1.5、T 偏 0.8、外套偏 3）
  kitchen: 0.8, // 一個碗 / 罐
  books: 0.6, // 一本精裝書
  electronics: 0.5, // 一條線材 / 一個小設備
  documents: 0.3, // 一個 A4 資料夾摺起
  cosmetics: 0.2, // 一支口紅 / 化妝品
  toys: 1.0, // 一個中型玩具
  tools: 1.5, // 一個工具或工具組
  sentimental: 0.4, // 一張照片 / 飾品
  other: 0.5, // 預設保守
};

/**
 * 算物品清單的「總估算體積」(L) — quantity 一起算。
 *
 * 純函式。空清單回 0。
 */
export function estimateTotalVolumeL(items: Item[]): number {
  return items.reduce((sum, it) => {
    const perItem = PER_ITEM_VOLUME_L[it.category] ?? PER_ITEM_VOLUME_L.other;
    return sum + perItem * Math.max(0, it.quantity);
  }, 0);
}

// ---------- 空間 fit ----------

/**
 * 預設空間利用率 — 不放滿 100%，留 20% 動線 / 拿取空間。
 */
export const DEFAULT_SPACE_UTILIZATION = 0.8;

/**
 * 算空間「可用容量」(L)；缺尺寸的空間回 null（無法計算）。
 *
 * 純函式。
 */
export function computeSpaceUsableCapacityL(
  space: Space,
  utilization: number = DEFAULT_SPACE_UTILIZATION,
): number | null {
  if (!space.widthCm || !space.heightCm || !space.depthCm) return null;
  const totalL = (space.widthCm * space.heightCm * space.depthCm) / 1000;
  return totalL * utilization;
}

/**
 * SKU 「進不進得去」這個空間 — 任一軸超過空間 95% 就刷掉。
 *
 * 0.95 比 utilization 寬鬆，因為形狀剛好 fit 也算數；
 * utilization 是「整體容量保留動線」的概念，與「物理塞得進去」不同。
 */
function fitsInSpace(sku: BoxSku, space: Space): boolean {
  if (!space.widthCm || !space.heightCm || !space.depthCm) return true; // 未量過尺寸不擋
  const cap = 0.95;
  return (
    sku.exterior.widthCm <= space.widthCm * cap &&
    sku.exterior.heightCm <= space.heightCm * cap &&
    sku.exterior.depthCm <= space.depthCm * cap
  );
}

// ---------- 排序：算每個 SKU 對該空間的「適合分數」----------

/**
 * 加權後的分數細項，方便 debug。
 *
 * - `coverageScore` 越高越好（蓋住越多物品越好）；
 * - `efficiencyScore` 越高越好（容量利用率高、不浪費也不擠）；
 * - `priceScore` 越高越好（同分時偏好便宜的）；
 * - `aestheticScore` 越高越好（材質與空間 kind 適配）；
 * - `categoryScore` 越高越好（SKU 適用類別命中物品的程度）。
 */
type SkuScoring = {
  coverageScore: number;
  efficiencyScore: number;
  priceScore: number;
  aestheticScore: number;
  categoryScore: number;
  totalScore: number;
  /** 推薦此 SKU 應採購的件數 */
  quantity: number;
  /** 預估這 quantity 個箱裝完物品後的填充率 (0~1)；> 1 表示裝不完 */
  projectedFillPercent: number;
};

/**
 * 衣櫃適合木 / 不織布，抽屜適合 PP / 木分隔，桌上適合木 / PP；
 * 儲藏室什麼都行（給 0.8 中性分）；其他 0.7 預設。
 */
const SPACE_MATERIAL_AESTHETIC: Record<SpaceKind, Partial<Record<BoxSku['material'], number>>> = {
  wardrobe: { non_woven: 1.0, wood_walnut: 0.95, wood_birch: 0.9, wood_oak: 0.85, clear_pp: 0.6, kraft_paper: 0.5 },
  drawer: { wood_birch: 1.0, wood_oak: 0.95, clear_pp: 0.9, wood_walnut: 0.85, non_woven: 0.4, kraft_paper: 0.5 },
  desk: { wood_walnut: 1.0, wood_oak: 0.95, wood_birch: 0.9, clear_pp: 0.7, kraft_paper: 0.5, non_woven: 0.3 },
  shelf: { wood_birch: 0.95, wood_oak: 0.95, wood_walnut: 0.95, clear_pp: 0.8, kraft_paper: 0.7, non_woven: 0.6 },
  storage_room: { clear_pp: 1.0, kraft_paper: 0.9, non_woven: 0.85, wood_birch: 0.8, wood_oak: 0.8, wood_walnut: 0.75 },
  other: { wood_birch: 0.8, wood_oak: 0.8, clear_pp: 0.8, wood_walnut: 0.75, kraft_paper: 0.7, non_woven: 0.7 },
};

function aestheticScoreFor(sku: BoxSku, spaceKind: SpaceKind): number {
  return SPACE_MATERIAL_AESTHETIC[spaceKind]?.[sku.material] ?? 0.7;
}

function categoryScoreFor(sku: BoxSku, items: Item[]): number {
  if (items.length === 0) return 0.5;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  if (totalQty === 0) return 0.5;
  let hitQty = 0;
  const suitable = new Set(sku.suitableCategories);
  for (const it of items) {
    if (suitable.has(it.category)) hitQty += it.quantity;
  }
  return hitQty / totalQty;
}

/**
 * 對一個 SKU 算分。
 *
 * 加權：
 *   - coverage 35%
 *   - efficiency 20%
 *   - aesthetic 15%
 *   - category fit 20%
 *   - price 10%
 */
function scoreSku(
  sku: BoxSku,
  items: Item[],
  totalVolumeL: number,
  spaceKind: SpaceKind,
  maxPriceTwd: number,
): SkuScoring {
  // 1) 件數：要幾個 SKU 才裝得完
  //    四捨五入向上 — 寧可多一個也不要不夠
  const safeCap = Math.max(0.1, sku.capacityL);
  const rawQuantity = totalVolumeL > 0 ? Math.ceil(totalVolumeL / safeCap) : 1;
  const quantity = Math.max(1, Math.min(rawQuantity, 6)); // 上限 6 個，過多就改推大箱

  const totalCap = sku.capacityL * quantity;
  const fill = totalCap > 0 ? totalVolumeL / totalCap : 0;
  const projectedFillPercent = fill;

  // 2) coverage：能裝下多少
  //    fill ≤ 1 → 1 - (1 - fill) * 0.5  (越接近 1 越好)
  //    fill > 1 → 1 / fill              (裝不完線性扣分)
  const coverageScore =
    fill <= 1 ? 1 - (1 - Math.min(1, fill)) * 0.5 : Math.max(0, 1 / fill);

  // 3) efficiency：填充率本身
  //    最甜蜜區：0.6 - 0.85；過低空，過高擠
  let efficiencyScore: number;
  if (fill < 0.4) efficiencyScore = fill / 0.4; // 0~1
  else if (fill <= 0.85) efficiencyScore = 1;
  else if (fill <= 1) efficiencyScore = 1 - (fill - 0.85) * 1.0; // 1 → 0.85
  else efficiencyScore = Math.max(0, 0.5 - (fill - 1) * 0.3);

  // 4) price：總價越接近 0 越好；做線性 normalize
  const totalPrice = sku.priceTwd * quantity;
  const priceScore = maxPriceTwd > 0 ? Math.max(0, 1 - totalPrice / maxPriceTwd) : 0.5;

  const aestheticScore = aestheticScoreFor(sku, spaceKind);
  const categoryScore = categoryScoreFor(sku, items);

  const totalScore =
    coverageScore * 0.35 +
    efficiencyScore * 0.2 +
    aestheticScore * 0.15 +
    categoryScore * 0.2 +
    priceScore * 0.1;

  return {
    coverageScore,
    efficiencyScore,
    priceScore,
    aestheticScore,
    categoryScore,
    totalScore,
    quantity,
    projectedFillPercent,
  };
}

// ---------- 推薦 API ----------

/**
 * 單筆推薦結果。
 */
export type BoxRecommendation = {
  skuId: string;
  quantity: number;
  /** 預估填充率 0~1（> 1 表示裝不完，演算法已扣分） */
  projectedFillPercent: number;
  /** 建議的雷雕字（已 trim 到 MAX_ENGRAVING_TEXT_LENGTH） */
  engravingText: string;
  /** 建議的 QR payload（deep link） */
  engravingQr: string;
  /** 總分（debug 用） */
  score: number;
  /** 細項分數（debug 用） */
  breakdown: SkuScoring;
};

export type RecommendOptions = {
  /** 最多回傳幾筆，預設 3 */
  topN?: number;
  /** 候選 SKU；不傳則用 BOX_CATALOG */
  candidates?: ReadonlyArray<BoxSku>;
  /** 空間利用率，預設 0.8 */
  utilization?: number;
};

/**
 * 給定空間 + 物品 → 推薦 1-N 個 SKU。
 *
 * 邊界：
 *   - 空間無尺寸：略過尺寸過濾、仍依物品總量算
 *   - 物品為空：仍會回最小型 SKU 作為「先準備一個」推薦
 *   - SKU 都太小裝不下：依然會回最大 SKU（quantity 加倍），但 projectedFill > 1
 *
 * 純函式。
 */
export function recommendBoxes(
  space: Space,
  items: Item[],
  opts: RecommendOptions = {},
): BoxRecommendation[] {
  const topN = opts.topN ?? 3;
  const candidates = opts.candidates ?? BOX_CATALOG;
  const utilization = opts.utilization ?? DEFAULT_SPACE_UTILIZATION;

  const totalVolumeL = estimateTotalVolumeL(items);
  const usableSpaceL = computeSpaceUsableCapacityL(space, utilization);

  // 1. 篩出能放進空間 + 適合的 SKU
  let pool = candidates.filter((s) => fitsInSpace(s, space));

  // 1b. 偏好符合空間種類的 SKU；若都沒匹配就退回全部 pool
  const matchedKind = pool.filter((s) => s.suitableSpaceKinds.includes(space.kind));
  if (matchedKind.length > 0) pool = matchedKind;

  if (pool.length === 0) pool = [...candidates];

  // 2. 算分
  const maxPriceTwd = Math.max(1, ...pool.map((s) => s.priceTwd * 3));
  const scored = pool.map((sku) => ({
    sku,
    scoring: scoreSku(sku, items, totalVolumeL, space.kind, maxPriceTwd),
  }));

  // 3. 排序：分數高在前；同分時偏好填充率接近 0.7 的
  scored.sort((a, b) => {
    if (b.scoring.totalScore !== a.scoring.totalScore) {
      return b.scoring.totalScore - a.scoring.totalScore;
    }
    const aDiff = Math.abs(a.scoring.projectedFillPercent - 0.7);
    const bDiff = Math.abs(b.scoring.projectedFillPercent - 0.7);
    return aDiff - bDiff;
  });

  // 4. 多材質一致性後處理：第一名選定後，前 N 同材質優先（給 +0.05 微調）
  if (scored.length > 1 && scored[0]) {
    const firstMaterial = scored[0].sku.material;
    scored.slice(1).forEach((entry) => {
      if (entry.sku.material === firstMaterial) {
        entry.scoring.totalScore += 0.05;
      }
    });
    scored.sort((a, b) => b.scoring.totalScore - a.scoring.totalScore);
  }

  // 5. 取前 topN，組裝推薦結果
  // usableSpaceL 暫不直接寫到結果裡，但留下計算讓未來能加「擺多少個會超過空間容量」警告
  void usableSpaceL;
  const engravingText = makeDefaultEngravingText(space);
  const engravingQr = makeDefaultEngravingQr(space);

  return scored.slice(0, topN).map((entry) => ({
    skuId: entry.sku.id,
    quantity: entry.scoring.quantity,
    projectedFillPercent: entry.scoring.projectedFillPercent,
    engravingText,
    engravingQr,
    score: entry.scoring.totalScore,
    breakdown: entry.scoring,
  }));
}

// ---------- 雷雕字 / QR 預設 ----------

/**
 * 預設雷雕字 — 取空間名稱、截到上限。
 * 使用者可在訂購流程修改。
 */
export function makeDefaultEngravingText(space: Space): string {
  const name = (space.name ?? '').trim();
  if (name.length === 0) return 'Amber Stash';
  if (name.length <= MAX_ENGRAVING_TEXT_LENGTH) return name;
  return name.slice(0, MAX_ENGRAVING_TEXT_LENGTH);
}

/**
 * 預設 QR 內容 — deep link 到該空間。
 * 與既有 labelHtml.ts 同一個 scheme，掃描後行為一致。
 */
export function makeDefaultEngravingQr(space: Space): string {
  return `amberstash://space/${space.id}`;
}
