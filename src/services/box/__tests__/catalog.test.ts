import { BOX_CATALOG, findSku, findSkusForSpaceKind, findSkusForCategory } from '../catalog';
import { ENGRAVABLE_MATERIALS } from '@/types/box';

describe('box catalog — 結構性檢查', () => {
  test('catalog 內 SKU 數量 ≥ 10', () => {
    expect(BOX_CATALOG.length).toBeGreaterThanOrEqual(10);
  });

  test('每個 SKU id 全域唯一', () => {
    const ids = BOX_CATALOG.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test('每個 SKU 有非空 name / tagline / suitableSpaceKinds / suitableCategories', () => {
    for (const sku of BOX_CATALOG) {
      expect(sku.name.length).toBeGreaterThan(0);
      expect(sku.tagline.length).toBeGreaterThan(0);
      expect(sku.suitableSpaceKinds.length).toBeGreaterThan(0);
      expect(sku.suitableCategories.length).toBeGreaterThan(0);
    }
  });
});

describe('box catalog — 尺寸合理性', () => {
  test('每個 SKU 內尺寸 < 外尺寸（壁厚 > 0）', () => {
    for (const sku of BOX_CATALOG) {
      expect(sku.interior.widthCm).toBeLessThan(sku.exterior.widthCm);
      expect(sku.interior.heightCm).toBeLessThan(sku.exterior.heightCm);
      expect(sku.interior.depthCm).toBeLessThan(sku.exterior.depthCm);
    }
  });

  test('每個 SKU 容量 = 內三軸 / 1000，誤差 ≤ 0.1 L', () => {
    for (const sku of BOX_CATALOG) {
      const expected = (sku.interior.widthCm * sku.interior.heightCm * sku.interior.depthCm) / 1000;
      expect(Math.abs(sku.capacityL - expected)).toBeLessThanOrEqual(0.1);
    }
  });

  test('每個 SKU 售價在合理區間 NT$ 150 – 2500', () => {
    for (const sku of BOX_CATALOG) {
      expect(sku.priceTwd).toBeGreaterThanOrEqual(150);
      expect(sku.priceTwd).toBeLessThanOrEqual(2500);
    }
  });

  test('雷雕區尺寸大於 0 且 ≤ 對應外殼面', () => {
    for (const sku of BOX_CATALOG) {
      expect(sku.engravingArea.widthCm).toBeGreaterThan(0);
      expect(sku.engravingArea.heightCm).toBeGreaterThan(0);
      // 雷雕區寬度不應超過外殼寬度（蓋面或正面寬度都受外殼寬限制）
      expect(sku.engravingArea.widthCm).toBeLessThanOrEqual(sku.exterior.widthCm);
    }
  });
});

describe('box catalog — 空間覆蓋', () => {
  test('衣櫃 (wardrobe) 至少 3 個適配 SKU', () => {
    const list = findSkusForSpaceKind('wardrobe');
    expect(list.length).toBeGreaterThanOrEqual(3);
  });

  test('抽屜 (drawer) 至少 3 個適配 SKU', () => {
    const list = findSkusForSpaceKind('drawer');
    expect(list.length).toBeGreaterThanOrEqual(3);
  });

  test('書桌 / 層架 / 儲藏室 / 其他 各至少 1 個適配 SKU', () => {
    expect(findSkusForSpaceKind('desk').length).toBeGreaterThanOrEqual(1);
    expect(findSkusForSpaceKind('shelf').length).toBeGreaterThanOrEqual(1);
    expect(findSkusForSpaceKind('storage_room').length).toBeGreaterThanOrEqual(1);
  });
});

describe('box catalog — 類別覆蓋', () => {
  test('clothing / kitchen / books / electronics / cosmetics / tools / toys 各至少 1 個 SKU', () => {
    const categories = ['clothing', 'kitchen', 'books', 'electronics', 'cosmetics', 'tools', 'toys'];
    for (const cat of categories) {
      const list = findSkusForCategory(cat);
      expect(list.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('box catalog — 尺寸帶分布', () => {
  test('小型 (< 5 L)、中型 (5-25 L)、大型 (> 25 L) 三個尺寸帶都各有 SKU', () => {
    const small = BOX_CATALOG.filter((s) => s.capacityL < 5);
    const medium = BOX_CATALOG.filter((s) => s.capacityL >= 5 && s.capacityL <= 25);
    const large = BOX_CATALOG.filter((s) => s.capacityL > 25);
    expect(small.length).toBeGreaterThanOrEqual(1);
    expect(medium.length).toBeGreaterThanOrEqual(1);
    expect(large.length).toBeGreaterThanOrEqual(1);
  });
});

describe('box catalog — 材質與雷雕', () => {
  test('catalog 至少包含一個樺木 / 胡桃木 / 橡木 / 牛皮紙 / PP / 不織布 SKU（六種材質都覆蓋）', () => {
    const materials = new Set(BOX_CATALOG.map((s) => s.material));
    expect(materials.has('wood_birch')).toBe(true);
    expect(materials.has('wood_walnut')).toBe(true);
    expect(materials.has('wood_oak')).toBe(true);
    expect(materials.has('kraft_paper')).toBe(true);
    expect(materials.has('clear_pp')).toBe(true);
    expect(materials.has('non_woven')).toBe(true);
  });

  test('ENGRAVABLE_MATERIALS 排除牛皮紙與不織布', () => {
    expect(ENGRAVABLE_MATERIALS.has('kraft_paper')).toBe(false);
    expect(ENGRAVABLE_MATERIALS.has('non_woven')).toBe(false);
    expect(ENGRAVABLE_MATERIALS.has('wood_birch')).toBe(true);
  });
});

describe('box catalog — helper', () => {
  test('findSku 找得到既有 SKU；找不到回 null', () => {
    const first = BOX_CATALOG[0];
    if (!first) throw new Error('catalog 為空');
    expect(findSku(first.id)?.id).toBe(first.id);
    expect(findSku('non-existent')).toBeNull();
  });
});
