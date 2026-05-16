import type { Item, Space } from '@/types';
import {
  recommendBoxes,
  estimateTotalVolumeL,
  computeSpaceUsableCapacityL,
  PER_ITEM_VOLUME_L,
  makeDefaultEngravingText,
  makeDefaultEngravingQr,
} from '../recommender';
import { findSku } from '../catalog';

// ---------- helpers ----------

function mkSpace(overrides: Partial<Space> = {}): Space {
  // 用 'widthCm' in overrides 判斷是否顯式傳了 undefined，
  // 區分「沒傳」與「傳 undefined」兩種情境（後者代表「沒尺寸」測試）。
  const out: Space = {
    id: overrides.id ?? 'space-1',
    name: overrides.name ?? '測試空間',
    kind: overrides.kind ?? 'wardrobe',
    widthCm: 'widthCm' in overrides ? overrides.widthCm : 180,
    heightCm: 'heightCm' in overrides ? overrides.heightCm : 220,
    depthCm: 'depthCm' in overrides ? overrides.depthCm : 60,
    createdAt: overrides.createdAt ?? 0,
    note: overrides.note,
  };
  return out;
}

function mkItem(overrides: Partial<Item> & Pick<Item, 'name' | 'category' | 'quantity'>): Item {
  return {
    id: overrides.id ?? `item-${overrides.name}`,
    name: overrides.name,
    category: overrides.category,
    quantity: overrides.quantity,
    spaceId: overrides.spaceId,
    photoUri: overrides.photoUri,
    note: overrides.note,
    createdAt: overrides.createdAt ?? 0,
    updatedAt: overrides.updatedAt ?? 0,
  };
}

// ---------- 體積估算 ----------

describe('estimateTotalVolumeL', () => {
  test('空清單回 0', () => {
    expect(estimateTotalVolumeL([])).toBe(0);
  });

  test('依 category 標準體積 × quantity 加總', () => {
    const items = [
      mkItem({ name: '毛衣', category: 'clothing', quantity: 5 }),
      mkItem({ name: '書', category: 'books', quantity: 10 }),
    ];
    const expected = PER_ITEM_VOLUME_L.clothing * 5 + PER_ITEM_VOLUME_L.books * 10;
    expect(estimateTotalVolumeL(items)).toBeCloseTo(expected);
  });

  test('quantity = 0 或負數視為 0', () => {
    const items = [
      mkItem({ name: 'A', category: 'clothing', quantity: 0 }),
      mkItem({ name: 'B', category: 'clothing', quantity: -3 }),
    ];
    expect(estimateTotalVolumeL(items)).toBe(0);
  });
});

// ---------- 空間容量 ----------

describe('computeSpaceUsableCapacityL', () => {
  test('完整尺寸 × 0.8 utilization', () => {
    const space = mkSpace({ widthCm: 100, heightCm: 100, depthCm: 100 });
    expect(computeSpaceUsableCapacityL(space)).toBeCloseTo(800);
  });

  test('缺尺寸回 null', () => {
    const space = mkSpace({ widthCm: undefined });
    expect(computeSpaceUsableCapacityL(space)).toBeNull();
  });
});

// ---------- 主推薦：demo data 的衣櫃 + 23 件衣物 ----------

describe('recommendBoxes — 主要驗收場景', () => {
  test('主臥衣櫃 (180×220×60) + 23 件衣物 → 至少推 1 個 SKU 且第一名適合 wardrobe', () => {
    const space = mkSpace({
      name: '主臥衣櫃',
      kind: 'wardrobe',
      widthCm: 180,
      heightCm: 220,
      depthCm: 60,
    });
    // demo data: 羽絨外套 3 + 毛衣 8 + 襯衫 12 = 23 件
    const items: Item[] = [
      mkItem({ name: '羽絨外套', category: 'clothing', quantity: 3 }),
      mkItem({ name: '毛衣', category: 'clothing', quantity: 8 }),
      mkItem({ name: '襯衫', category: 'clothing', quantity: 12 }),
    ];

    const recs = recommendBoxes(space, items);
    expect(recs.length).toBeGreaterThanOrEqual(1);
    const top = recs[0];
    if (!top) throw new Error('expected at least one recommendation');

    const sku = findSku(top.skuId);
    expect(sku).not.toBeNull();
    if (!sku) throw new Error('sku not in catalog');
    expect(sku.suitableSpaceKinds).toContain('wardrobe');
    expect(top.quantity).toBeGreaterThanOrEqual(1);
    expect(top.score).toBeGreaterThan(0);
  });

  test('topN 預設 3；可改為 1', () => {
    const space = mkSpace({ name: '抽屜', kind: 'drawer', widthCm: 60, heightCm: 20, depthCm: 45 });
    const items = [mkItem({ name: '線材', category: 'electronics', quantity: 5 })];
    expect(recommendBoxes(space, items).length).toBeLessThanOrEqual(3);
    expect(recommendBoxes(space, items, { topN: 1 }).length).toBe(1);
  });

  test('engravingText 預設取空間名稱、QR 用 deep link', () => {
    const space = mkSpace({ id: 'sp-77', name: '玄關抽屜', kind: 'drawer' });
    const recs = recommendBoxes(space, []);
    expect(recs[0]?.engravingText).toBe('玄關抽屜');
    expect(recs[0]?.engravingQr).toBe('amberstash://space/sp-77');
  });
});

// ---------- 邊界 ----------

describe('recommendBoxes — 邊界', () => {
  test('未指定空間尺寸時也能推薦（fallback：不擋）', () => {
    const space = mkSpace({
      widthCm: undefined,
      heightCm: undefined,
      depthCm: undefined,
    });
    const items = [mkItem({ name: '衣物', category: 'clothing', quantity: 10 })];
    const recs = recommendBoxes(space, items);
    expect(recs.length).toBeGreaterThan(0);
  });

  test('物品為空時仍會推薦（給「先準備」的最小箱）', () => {
    const space = mkSpace({ kind: 'desk', widthCm: 140, heightCm: 75, depthCm: 70 });
    const recs = recommendBoxes(space, []);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]?.quantity).toBeGreaterThanOrEqual(1);
  });

  test('小抽屜 + 大量物品 → 推薦多個小盒（quantity > 1）或大盒被擋', () => {
    const space = mkSpace({
      name: '玄關抽屜',
      kind: 'drawer',
      widthCm: 60,
      heightCm: 20,
      depthCm: 45,
    });
    const items: Item[] = [mkItem({ name: '電線', category: 'electronics', quantity: 30 })];
    const recs = recommendBoxes(space, items);
    expect(recs.length).toBeGreaterThan(0);
    const top = recs[0];
    if (!top) throw new Error('no recommendation');
    const sku = findSku(top.skuId);
    if (!sku) throw new Error('sku missing');
    // 抽屜 60×20×45 cm — 大型 SKU 一定塞不進去
    expect(sku.exterior.widthCm).toBeLessThanOrEqual(60 * 0.95);
    expect(sku.exterior.heightCm).toBeLessThanOrEqual(20 * 0.95);
  });
});

// ---------- 雷雕字 helper ----------

describe('makeDefaultEngravingText', () => {
  test('短名稱原樣', () => {
    const sp = mkSpace({ name: '主臥' });
    expect(makeDefaultEngravingText(sp)).toBe('主臥');
  });

  test('超過 12 字截掉', () => {
    const sp = mkSpace({ name: '這是一個非常非常長的空間名稱嗎是的' });
    const r = makeDefaultEngravingText(sp);
    expect(r.length).toBeLessThanOrEqual(12);
  });

  test('空名稱 fallback', () => {
    const sp = mkSpace({ name: '' });
    expect(makeDefaultEngravingText(sp).length).toBeGreaterThan(0);
  });
});

describe('makeDefaultEngravingQr', () => {
  test('產生 amberstash deep link', () => {
    expect(makeDefaultEngravingQr(mkSpace({ id: 'xyz' }))).toBe('amberstash://space/xyz');
  });
});

// ---------- 美學一致：衣櫃推薦會優先 wood/non_woven ----------

describe('recommendBoxes — 美學一致性', () => {
  test('衣櫃推薦 top-3 偏好 wood 或 non_woven 材質（aesthetic 高分項）', () => {
    const space = mkSpace({ kind: 'wardrobe' });
    const items = [mkItem({ name: '冬衣', category: 'clothing', quantity: 20 })];
    const recs = recommendBoxes(space, items);
    const top = recs[0];
    if (!top) throw new Error('no rec');
    const sku = findSku(top.skuId);
    if (!sku) throw new Error('no sku');
    // 在衣櫃內，clear_pp 與 kraft_paper 的美學分都偏低（< 0.65），不太會是第一名
    expect(['wood_birch', 'wood_walnut', 'wood_oak', 'non_woven']).toContain(sku.material);
  });

  test('書桌推薦會傾向木質（wood_walnut / wood_oak / wood_birch）', () => {
    const space = mkSpace({ kind: 'desk', widthCm: 140, heightCm: 75, depthCm: 70 });
    const items = [mkItem({ name: '原子筆', category: 'books', quantity: 12 })];
    const recs = recommendBoxes(space, items);
    const top = recs[0];
    if (!top) throw new Error('no rec');
    const sku = findSku(top.skuId);
    if (!sku) throw new Error('no sku');
    expect(['wood_walnut', 'wood_oak', 'wood_birch']).toContain(sku.material);
  });
});
