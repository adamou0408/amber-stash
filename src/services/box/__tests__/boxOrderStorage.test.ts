import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import {
  createBoxOrder,
  getBoxOrder,
  deleteBoxOrder,
  updateBoxOrder,
  advanceStatus,
  advanceStatusWithTracking,
  canTransition,
  loadBoxOrders,
  listBoxOrdersForSpace,
  listBoxOrdersByStatus,
  LEGAL_TRANSITIONS,
  InvalidBoxOrderTransitionError,
} from '@/storage/boxOrderStorage';
import { BOX_CATALOG } from '../catalog';
import type { BoxOrderStatus } from '@/types/box';

beforeEach(async () => {
  // @ts-expect-error — mock helper
  AsyncStorage.__reset?.();
  // @ts-expect-error — mock helper
  uuid.__reset?.();
});

const firstSku = BOX_CATALOG[0];
if (!firstSku) throw new Error('catalog empty');

const baseInput = {
  spaceId: 'space-A',
  skuId: firstSku.id,
  quantity: 1,
  engravingText: '主臥衣櫃',
  engravingQrPayload: 'amberstash://space/space-A',
};

// ---------- CRUD ----------

describe('boxOrderStorage — CRUD round-trip', () => {
  test('createBoxOrder writes and getBoxOrder reads the same', async () => {
    const created = await createBoxOrder(baseInput);
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('draft');
    expect(created.unitPriceTwdSnapshot).toBe(firstSku.priceTwd);

    const loaded = await getBoxOrder(created.id);
    expect(loaded?.id).toBe(created.id);
    expect(loaded?.spaceId).toBe('space-A');
    expect(loaded?.skuId).toBe(firstSku.id);
  });

  test('createBoxOrder rejects unknown SKU', async () => {
    await expect(
      createBoxOrder({ ...baseInput, skuId: 'sku-does-not-exist' }),
    ).rejects.toThrow(/找不到 SKU/);
  });

  test('createBoxOrder rejects quantity <= 0', async () => {
    await expect(createBoxOrder({ ...baseInput, quantity: 0 })).rejects.toThrow(/quantity/);
  });

  test('updateBoxOrder modifies allowed fields only', async () => {
    const o = await createBoxOrder(baseInput);
    const updated = await updateBoxOrder(o.id, {
      engravingText: '新文字',
      note: '客戶來電修改',
      quantity: 3,
    });
    expect(updated?.engravingText).toBe('新文字');
    expect(updated?.note).toBe('客戶來電修改');
    expect(updated?.quantity).toBe(3);
    // 還在 draft（updateBoxOrder 不改 status）
    expect(updated?.status).toBe('draft');
  });

  test('deleteBoxOrder removes from list', async () => {
    const o = await createBoxOrder(baseInput);
    expect(await loadBoxOrders()).toHaveLength(1);
    await deleteBoxOrder(o.id);
    expect(await loadBoxOrders()).toHaveLength(0);
  });

  test('listBoxOrdersForSpace 過濾並 DESC 排序', async () => {
    const a = await createBoxOrder({ ...baseInput, spaceId: 'space-A' });
    // 確保時間戳不同
    await new Promise((r) => setTimeout(r, 5));
    const b = await createBoxOrder({ ...baseInput, spaceId: 'space-A' });
    await createBoxOrder({ ...baseInput, spaceId: 'space-B' });
    const aList = await listBoxOrdersForSpace('space-A');
    expect(aList).toHaveLength(2);
    expect(aList[0]?.timestamps.createdAt).toBeGreaterThanOrEqual(
      aList[1]?.timestamps.createdAt ?? 0,
    );
    expect(aList.map((o) => o.id)).toContain(a.id);
    expect(aList.map((o) => o.id)).toContain(b.id);
  });

  test('listBoxOrdersByStatus 過濾', async () => {
    const o = await createBoxOrder(baseInput);
    expect(await listBoxOrdersByStatus('draft')).toHaveLength(1);
    expect(await listBoxOrdersByStatus('placed')).toHaveLength(0);
    await advanceStatus(o.id, 'placed');
    expect(await listBoxOrdersByStatus('draft')).toHaveLength(0);
    expect(await listBoxOrdersByStatus('placed')).toHaveLength(1);
  });
});

// ---------- 狀態流轉合法性 ----------

describe('boxOrderStorage — canTransition (合法 / 非法判斷)', () => {
  test('draft → placed 合法', () => {
    expect(canTransition('draft', 'placed')).toBe(true);
  });

  test('placed → in_production 合法', () => {
    expect(canTransition('placed', 'in_production')).toBe(true);
  });

  test('in_production → shipped 合法', () => {
    expect(canTransition('in_production', 'shipped')).toBe(true);
  });

  test('shipped → delivered 合法', () => {
    expect(canTransition('shipped', 'delivered')).toBe(true);
  });

  test('draft / placed / in_production → cancelled 合法', () => {
    expect(canTransition('draft', 'cancelled')).toBe(true);
    expect(canTransition('placed', 'cancelled')).toBe(true);
    expect(canTransition('in_production', 'cancelled')).toBe(true);
  });

  test('shipped → cancelled 非法（已寄出不能取消）', () => {
    expect(canTransition('shipped', 'cancelled')).toBe(false);
  });

  test('delivered → cancelled 非法', () => {
    expect(canTransition('delivered', 'cancelled')).toBe(false);
  });

  test('skip 階段非法：draft → shipped', () => {
    expect(canTransition('draft', 'shipped')).toBe(false);
  });

  test('skip 階段非法：placed → delivered', () => {
    expect(canTransition('placed', 'delivered')).toBe(false);
  });

  test('倒退非法：shipped → in_production / placed', () => {
    expect(canTransition('shipped', 'in_production')).toBe(false);
    expect(canTransition('shipped', 'placed')).toBe(false);
  });

  test('終態 cancelled 不能再轉', () => {
    expect(canTransition('cancelled', 'draft')).toBe(false);
    expect(canTransition('cancelled', 'placed')).toBe(false);
  });

  test('同狀態不算合法轉移', () => {
    const all: BoxOrderStatus[] = ['draft', 'placed', 'in_production', 'shipped', 'delivered', 'cancelled'];
    for (const s of all) {
      expect(canTransition(s, s)).toBe(false);
    }
  });

  test('LEGAL_TRANSITIONS 表完整：每個 status 都有定義', () => {
    const all: BoxOrderStatus[] = ['draft', 'placed', 'in_production', 'shipped', 'delivered', 'cancelled'];
    for (const s of all) {
      expect(LEGAL_TRANSITIONS[s]).toBeDefined();
    }
  });
});

// ---------- 狀態流轉執行 ----------

describe('boxOrderStorage — advanceStatus 執行', () => {
  test('合法轉移成功並寫入對應 timestamp', async () => {
    const o = await createBoxOrder(baseInput);
    const placed = await advanceStatus(o.id, 'placed');
    expect(placed.status).toBe('placed');
    expect(placed.timestamps.placedAt).toBeGreaterThan(0);
    expect(placed.timestamps.createdAt).toBeGreaterThan(0);
  });

  test('完整 happy path：draft → placed → in_production → shipped → delivered', async () => {
    const o = await createBoxOrder(baseInput);
    const a = await advanceStatus(o.id, 'placed');
    const b = await advanceStatus(o.id, 'in_production');
    const c = await advanceStatusWithTracking(o.id, 'shipped', 'TW-2026-001');
    const d = await advanceStatus(o.id, 'delivered');
    expect(a.status).toBe('placed');
    expect(b.status).toBe('in_production');
    expect(c.status).toBe('shipped');
    expect(c.trackingNumber).toBe('TW-2026-001');
    expect(d.status).toBe('delivered');
    expect(d.timestamps.placedAt).toBeGreaterThan(0);
    expect(d.timestamps.inProductionAt).toBeGreaterThan(0);
    expect(d.timestamps.shippedAt).toBeGreaterThan(0);
    expect(d.timestamps.deliveredAt).toBeGreaterThan(0);
  });

  test('非法轉移擋下並拋 InvalidBoxOrderTransitionError', async () => {
    const o = await createBoxOrder(baseInput);
    await expect(advanceStatus(o.id, 'shipped')).rejects.toBeInstanceOf(
      InvalidBoxOrderTransitionError,
    );
    // 訂單狀態未改
    const reloaded = await getBoxOrder(o.id);
    expect(reloaded?.status).toBe('draft');
  });

  test('shipped 後嘗試 cancel 會擋', async () => {
    const o = await createBoxOrder(baseInput);
    await advanceStatus(o.id, 'placed');
    await advanceStatus(o.id, 'in_production');
    await advanceStatus(o.id, 'shipped');
    await expect(advanceStatus(o.id, 'cancelled')).rejects.toBeInstanceOf(
      InvalidBoxOrderTransitionError,
    );
  });

  test('delivered 後任何轉移都會擋（終態）', async () => {
    const o = await createBoxOrder(baseInput);
    await advanceStatus(o.id, 'placed');
    await advanceStatus(o.id, 'in_production');
    await advanceStatus(o.id, 'shipped');
    await advanceStatus(o.id, 'delivered');
    await expect(advanceStatus(o.id, 'shipped')).rejects.toBeInstanceOf(InvalidBoxOrderTransitionError);
    await expect(advanceStatus(o.id, 'cancelled')).rejects.toBeInstanceOf(InvalidBoxOrderTransitionError);
  });

  test('draft → cancelled 合法', async () => {
    const o = await createBoxOrder(baseInput);
    const cancelled = await advanceStatus(o.id, 'cancelled');
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.timestamps.cancelledAt).toBeGreaterThan(0);
  });

  test('找不到 order 時拋錯', async () => {
    await expect(advanceStatus('non-existent', 'placed')).rejects.toThrow(/找不到訂單/);
  });
});
