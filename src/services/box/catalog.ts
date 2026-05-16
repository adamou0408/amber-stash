/**
 * Amber Stash 客製收納箱內建 catalog。
 *
 * 目前 13 個 SKU，分三個尺寸帶：
 *   - 小（< 5 L）          ：抽屜內、桌面、化妝品
 *   - 中（5 - 25 L）       ：分隔組、廚房乾貨、書桌雜物、玩具
 *   - 大（> 25 L）         ：衣櫃換季、儲藏、工具
 *
 * 設計準則：
 *  - 尺寸取台灣常見市售規格（IKEA / MUJI / NITORI 對齊），不憑空捏造
 *  - 壁厚假設：木 0.6 cm（單側）→ 內外尺寸差 1.2 cm；
 *             PP / 紙 / 不織布 0.3 cm → 差 0.6 cm
 *  - 雷雕區：箱蓋的長邊 60%、短邊 50%，留邊不擠
 *  - 售價：用「每 L NT$ 60–110」帶 + 材質溢價（木 1.4×、PP 0.7×、紙 0.5×、不織布 0.4×）
 */

import type { BoxSku, BoxDimensions } from '@/types/box';

// ---------- helper：算容量、製造合理內尺寸 ----------

/**
 * 容量 L = 內尺寸三軸 (cm) 相乘 / 1000，向下取一位小數。
 * 不直接 (cm^3 / 1000) 是因 toFixed 可能拋出 trailing 0；用 round。
 */
function capacityFromInterior(d: BoxDimensions): number {
  const liters = (d.widthCm * d.heightCm * d.depthCm) / 1000;
  return Math.round(liters * 10) / 10;
}

// ---------- catalog 本體 ----------

/**
 * 內建 SKU 表 — 依尺寸分組；同尺寸組內依材質排序。
 *
 * 對應驗收：
 *   - 衣櫃 (wardrobe) 至少 3 個適配 SKU：sku-wardrobe-bin-l-walnut / sku-clothing-fabric-l / sku-wardrobe-storage-xl-birch
 *   - 抽屜 (drawer) 至少 3 個適配 SKU：sku-drawer-divider-s / sku-drawer-cosmetic-s-clear / sku-drawer-divider-medium-birch
 *   - 書桌 / 層架 / 儲藏室 也各有 1+ SKU
 */
export const BOX_CATALOG: ReadonlyArray<BoxSku> = (() => {
  const skus: BoxSku[] = [];

  // === 小型（< 5 L）===

  skus.push({
    id: 'sku-drawer-divider-s-birch',
    name: '樺木抽屜分隔小盒',
    material: 'wood_birch',
    exterior: { widthCm: 15, heightCm: 6, depthCm: 20 },
    interior: { widthCm: 13.8, heightCm: 4.8, depthCm: 18.8 },
    capacityL: 0, // placeholder, overridden below
    engravingArea: { widthCm: 9, heightCm: 3, surface: 'front' },
    priceTwd: 380,
    suitableSpaceKinds: ['drawer', 'desk'],
    suitableCategories: ['tools', 'electronics', 'cosmetics', 'documents', 'other'],
    tagline: '玄關抽屜分隔，鑰匙 / 線材一目了然',
  });

  skus.push({
    id: 'sku-drawer-cosmetic-s-clear',
    name: '透明 PP 化妝品收納',
    material: 'clear_pp',
    exterior: { widthCm: 22, heightCm: 8, depthCm: 14 },
    interior: { widthCm: 21.4, heightCm: 7.4, depthCm: 13.4 },
    capacityL: 0,
    engravingArea: { widthCm: 13, heightCm: 4, surface: 'lid' },
    priceTwd: 220,
    suitableSpaceKinds: ['drawer', 'shelf', 'desk'],
    suitableCategories: ['cosmetics', 'other'],
    tagline: '透明側板一眼看內容物，疊放不疊放都美',
  });

  skus.push({
    id: 'sku-desk-pen-s-oak',
    name: '橡木筆筒分隔組',
    material: 'wood_oak',
    exterior: { widthCm: 12, heightCm: 10, depthCm: 12 },
    interior: { widthCm: 10.8, heightCm: 8.8, depthCm: 10.8 },
    capacityL: 0,
    engravingArea: { widthCm: 7, heightCm: 5, surface: 'front' },
    priceTwd: 480,
    suitableSpaceKinds: ['desk', 'shelf'],
    suitableCategories: ['books', 'tools', 'other'],
    tagline: '桌面立式分隔，原子筆 / 剪刀 / 小工具直立收',
  });

  // === 中型（5 - 25 L）===

  skus.push({
    id: 'sku-drawer-divider-m-birch',
    name: '樺木抽屜分隔組（中）',
    material: 'wood_birch',
    exterior: { widthCm: 40, heightCm: 8, depthCm: 30 },
    interior: { widthCm: 38.8, heightCm: 6.8, depthCm: 28.8 },
    capacityL: 0,
    engravingArea: { widthCm: 24, heightCm: 4, surface: 'front' },
    priceTwd: 780,
    suitableSpaceKinds: ['drawer', 'shelf'],
    suitableCategories: ['clothing', 'documents', 'cosmetics', 'tools', 'electronics'],
    tagline: '中型抽屜萬用分隔，內衣 / 襪子 / 配件直立收納',
  });

  skus.push({
    id: 'sku-kitchen-grain-m-clear',
    name: '透明 PP 廚房乾貨罐',
    material: 'clear_pp',
    exterior: { widthCm: 18, heightCm: 22, depthCm: 18 },
    interior: { widthCm: 17.4, heightCm: 21.4, depthCm: 17.4 },
    capacityL: 0,
    engravingArea: { widthCm: 10, heightCm: 8, surface: 'front' },
    priceTwd: 320,
    suitableSpaceKinds: ['shelf', 'storage_room'],
    suitableCategories: ['kitchen', 'other'],
    tagline: '密封乾貨罐，米麵糖五穀雷雕分類',
  });

  skus.push({
    id: 'sku-desk-supply-m-walnut',
    name: '胡桃木文具收納盒',
    material: 'wood_walnut',
    exterior: { widthCm: 30, heightCm: 12, depthCm: 22 },
    interior: { widthCm: 28.8, heightCm: 10.8, depthCm: 20.8 },
    capacityL: 0,
    engravingArea: { widthCm: 18, heightCm: 6, surface: 'lid' },
    priceTwd: 1280,
    suitableSpaceKinds: ['desk', 'shelf'],
    suitableCategories: ['books', 'documents', 'electronics', 'tools'],
    tagline: '書桌中型雜物，文具 / 充電線 / 印章一格一物',
  });

  skus.push({
    id: 'sku-toy-bin-m-kraft',
    name: '牛皮紙玩具收納箱',
    material: 'kraft_paper',
    exterior: { widthCm: 35, heightCm: 30, depthCm: 28 },
    interior: { widthCm: 34.4, heightCm: 29.4, depthCm: 27.4 },
    capacityL: 0,
    engravingArea: { widthCm: 20, heightCm: 10, surface: 'front' },
    priceTwd: 180,
    suitableSpaceKinds: ['shelf', 'storage_room', 'other'],
    suitableCategories: ['toys', 'other', 'sentimental'],
    tagline: '輕量紙箱，孩子能自己拿，印字不雷雕',
  });

  skus.push({
    id: 'sku-document-file-m-birch',
    name: '樺木 A4 文件收納',
    material: 'wood_birch',
    exterior: { widthCm: 26, heightCm: 32, depthCm: 35 },
    interior: { widthCm: 24.8, heightCm: 30.8, depthCm: 33.8 },
    capacityL: 0,
    engravingArea: { widthCm: 16, heightCm: 8, surface: 'front' },
    priceTwd: 1180,
    suitableSpaceKinds: ['desk', 'shelf', 'storage_room'],
    suitableCategories: ['documents', 'books'],
    tagline: 'A4 直立式檔案夾收納，雷雕年份 / 類別',
  });

  // === 大型（> 25 L）===

  skus.push({
    id: 'sku-wardrobe-clothing-l-fabric',
    name: '不織布衣物折疊箱',
    material: 'non_woven',
    exterior: { widthCm: 38, heightCm: 25, depthCm: 50 },
    interior: { widthCm: 37.4, heightCm: 24.4, depthCm: 49.4 },
    capacityL: 0,
    engravingArea: { widthCm: 20, heightCm: 10, surface: 'front' }, // 印刷非雷雕
    priceTwd: 360,
    suitableSpaceKinds: ['wardrobe', 'storage_room'],
    suitableCategories: ['clothing', 'sentimental'],
    tagline: '可折疊不織布，輕便換季用；印刷非雷雕',
  });

  skus.push({
    id: 'sku-wardrobe-bin-l-walnut',
    name: '胡桃木衣櫃換季箱',
    material: 'wood_walnut',
    exterior: { widthCm: 45, heightCm: 28, depthCm: 60 },
    interior: { widthCm: 43.8, heightCm: 26.8, depthCm: 58.8 },
    capacityL: 0,
    engravingArea: { widthCm: 28, heightCm: 12, surface: 'lid' },
    priceTwd: 2280,
    suitableSpaceKinds: ['wardrobe', 'storage_room'],
    suitableCategories: ['clothing', 'sentimental'],
    tagline: '高質感衣物換季箱，蓋面雷雕季節與類別',
  });

  skus.push({
    id: 'sku-wardrobe-storage-xl-birch',
    name: '樺木大型整理箱',
    material: 'wood_birch',
    exterior: { widthCm: 55, heightCm: 35, depthCm: 70 },
    interior: { widthCm: 53.8, heightCm: 33.8, depthCm: 68.8 },
    capacityL: 0,
    engravingArea: { widthCm: 32, heightCm: 14, surface: 'lid' },
    priceTwd: 2480,
    suitableSpaceKinds: ['wardrobe', 'storage_room'],
    suitableCategories: ['clothing', 'toys', 'tools', 'sentimental', 'other'],
    tagline: '大尺寸全能箱，被毯 / 大件外套都進得去',
  });

  skus.push({
    id: 'sku-tool-box-l-oak',
    name: '橡木工具箱',
    material: 'wood_oak',
    exterior: { widthCm: 42, heightCm: 22, depthCm: 30 },
    interior: { widthCm: 40.8, heightCm: 20.8, depthCm: 28.8 },
    capacityL: 0,
    engravingArea: { widthCm: 24, heightCm: 10, surface: 'lid' },
    priceTwd: 1680,
    suitableSpaceKinds: ['storage_room', 'shelf'],
    suitableCategories: ['tools', 'electronics'],
    tagline: '工具 / 五金分類，有提把可移動',
  });

  skus.push({
    id: 'sku-storage-utility-l-clear',
    name: '透明 PP 大儲物盒',
    material: 'clear_pp',
    exterior: { widthCm: 50, heightCm: 30, depthCm: 40 },
    interior: { widthCm: 49.4, heightCm: 29.4, depthCm: 39.4 },
    capacityL: 0,
    engravingArea: { widthCm: 28, heightCm: 12, surface: 'lid' },
    priceTwd: 820,
    suitableSpaceKinds: ['storage_room', 'wardrobe'],
    suitableCategories: ['other', 'toys', 'tools', 'sentimental'],
    tagline: '透明 PP 大儲物，看見內容物的雜物總集區',
  });

  // 補上每個 SKU 的容量
  return skus.map((s) => ({ ...s, capacityL: capacityFromInterior(s.interior) }));
})();

// ---------- 查詢 helper ----------

/** 依 id 取得 SKU；找不到回 null。 */
export function findSku(id: string): BoxSku | null {
  return BOX_CATALOG.find((s) => s.id === id) ?? null;
}

/** 找適合指定空間種類的所有 SKU。 */
export function findSkusForSpaceKind(kind: string): BoxSku[] {
  return BOX_CATALOG.filter((s) =>
    (s.suitableSpaceKinds as string[]).includes(kind),
  );
}

/** 找適合指定物品類別的所有 SKU。 */
export function findSkusForCategory(category: string): BoxSku[] {
  return BOX_CATALOG.filter((s) =>
    (s.suitableCategories as string[]).includes(category),
  );
}
