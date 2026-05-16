/**
 * BoxOrder 儲存層 + 狀態流轉。
 *
 * 與既有 storage 同模式：
 *   - AsyncStorage 一個 key 存陣列
 *   - CRUD 純 async function
 *
 * 額外：狀態流轉合法性驗證（advanceStatus）— 守住業務不變量。
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import type { BoxOrder, BoxOrderStatus, BoxOrderTimestamps } from '@/types/box';
import { findSku } from '@/services/box/catalog';
import { STORAGE_KEYS } from './keys';

// ---------- 合法狀態轉移 ----------

/**
 * 狀態 → 可前往的下一狀態集合。
 *
 * 規則：
 *   - 主軸線性：draft → placed → in_production → shipped → delivered
 *   - 出貨前任何狀態都能 cancel；出貨後不能 cancel（已寄出回不來）
 *   - 不允許跳過階段（如 draft → shipped）
 *   - 不允許倒退（如 shipped → in_production）— 工廠端流程不可逆
 *   - terminal 狀態（delivered、cancelled）無法再轉
 */
export const LEGAL_TRANSITIONS: Readonly<Record<BoxOrderStatus, ReadonlyArray<BoxOrderStatus>>> = {
  draft: ['placed', 'cancelled'],
  placed: ['in_production', 'cancelled'],
  in_production: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

/** 檢查 from → to 是否合法。 */
export function canTransition(from: BoxOrderStatus, to: BoxOrderStatus): boolean {
  if (from === to) return false;
  return LEGAL_TRANSITIONS[from].includes(to);
}

export class InvalidBoxOrderTransitionError extends Error {
  constructor(public from: BoxOrderStatus, public to: BoxOrderStatus) {
    super(`非法狀態轉移：${from} → ${to}`);
    this.name = 'InvalidBoxOrderTransitionError';
  }
}

// ---------- raw load / save ----------

export async function loadBoxOrders(): Promise<BoxOrder[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.boxOrders);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BoxOrder[];
  } catch {
    return [];
  }
}

async function saveAll(orders: BoxOrder[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.boxOrders, JSON.stringify(orders));
}

// ---------- CRUD ----------

export type CreateBoxOrderInput = {
  spaceId: string;
  skuId: string;
  quantity: number;
  engravingText: string;
  engravingQrPayload: string;
  note?: string;
};

/**
 * 建立草稿訂單（status = 'draft'）。
 * 自動帶入：id / createdAt timestamp / 單價快照（從 catalog 查）。
 *
 * 找不到 SKU 會 throw。
 */
export async function createBoxOrder(input: CreateBoxOrderInput): Promise<BoxOrder> {
  const sku = findSku(input.skuId);
  if (!sku) {
    throw new Error(`createBoxOrder: 找不到 SKU ${input.skuId}`);
  }
  if (input.quantity <= 0) {
    throw new Error(`createBoxOrder: quantity 必須 > 0`);
  }
  const orders = await loadBoxOrders();
  const order: BoxOrder = {
    id: String(uuid.v4()),
    spaceId: input.spaceId,
    skuId: input.skuId,
    quantity: input.quantity,
    engravingText: input.engravingText,
    engravingQrPayload: input.engravingQrPayload,
    status: 'draft',
    timestamps: { createdAt: Date.now() },
    note: input.note,
    unitPriceTwdSnapshot: sku.priceTwd,
  };
  await saveAll([order, ...orders]);
  return order;
}

export async function getBoxOrder(orderId: string): Promise<BoxOrder | null> {
  const orders = await loadBoxOrders();
  return orders.find((o) => o.id === orderId) ?? null;
}

export async function deleteBoxOrder(orderId: string): Promise<void> {
  const orders = await loadBoxOrders();
  await saveAll(orders.filter((o) => o.id !== orderId));
}

/**
 * 更新訂單欄位（不含 status —— status 請走 advanceStatus）。
 *
 * 不允許更新：id / status / timestamps / unitPriceTwdSnapshot。
 */
export async function updateBoxOrder(
  orderId: string,
  patch: Partial<
    Pick<BoxOrder, 'engravingText' | 'engravingQrPayload' | 'quantity' | 'note' | 'trackingNumber'>
  >,
): Promise<BoxOrder | null> {
  const orders = await loadBoxOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  const existing = orders[idx];
  if (!existing) return null;
  const next: BoxOrder = { ...existing, ...patch };
  orders[idx] = next;
  await saveAll(orders);
  return next;
}

// ---------- 狀態流轉 ----------

/** 把 timestamp 寫到對應欄位。 */
function stampTimestamp(ts: BoxOrderTimestamps, status: BoxOrderStatus, at: number): BoxOrderTimestamps {
  switch (status) {
    case 'placed':
      return { ...ts, placedAt: at };
    case 'in_production':
      return { ...ts, inProductionAt: at };
    case 'shipped':
      return { ...ts, shippedAt: at };
    case 'delivered':
      return { ...ts, deliveredAt: at };
    case 'cancelled':
      return { ...ts, cancelledAt: at };
    case 'draft':
      return ts; // draft 已在 createdAt
  }
}

/**
 * 推進訂單狀態 — 帶合法性檢查。
 *
 * 規則由 LEGAL_TRANSITIONS 表決定；非法轉移會拋 InvalidBoxOrderTransitionError。
 *
 * 若要附帶 trackingNumber（通常 shipped 時填），用 advanceStatusWithTracking。
 */
export async function advanceStatus(
  orderId: string,
  newStatus: BoxOrderStatus,
): Promise<BoxOrder> {
  return advanceStatusWithTracking(orderId, newStatus);
}

export async function advanceStatusWithTracking(
  orderId: string,
  newStatus: BoxOrderStatus,
  trackingNumber?: string,
): Promise<BoxOrder> {
  const orders = await loadBoxOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) throw new Error(`advanceStatus: 找不到訂單 ${orderId}`);
  const existing = orders[idx];
  if (!existing) throw new Error(`advanceStatus: 找不到訂單 ${orderId}`);

  if (!canTransition(existing.status, newStatus)) {
    throw new InvalidBoxOrderTransitionError(existing.status, newStatus);
  }

  const now = Date.now();
  const next: BoxOrder = {
    ...existing,
    status: newStatus,
    timestamps: stampTimestamp(existing.timestamps, newStatus, now),
    ...(trackingNumber !== undefined ? { trackingNumber } : {}),
  };
  orders[idx] = next;
  await saveAll(orders);
  return next;
}

// ---------- 查詢 ----------

/** 列出某 space 的所有訂單（依建立時間 DESC）。 */
export async function listBoxOrdersForSpace(spaceId: string): Promise<BoxOrder[]> {
  const orders = await loadBoxOrders();
  return orders
    .filter((o) => o.spaceId === spaceId)
    .sort((a, b) => b.timestamps.createdAt - a.timestamps.createdAt);
}

/** 列出指定狀態的所有訂單（依建立時間 DESC）。 */
export async function listBoxOrdersByStatus(status: BoxOrderStatus): Promise<BoxOrder[]> {
  const orders = await loadBoxOrders();
  return orders
    .filter((o) => o.status === status)
    .sort((a, b) => b.timestamps.createdAt - a.timestamps.createdAt);
}
