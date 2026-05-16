import uuid from 'react-native-uuid';
import type { Detection } from '@/types/snapshot';
import type { ItemCategory } from '@/types';

/**
 * Mock 提案 — 沒有 API key 時用，讓 dev / demo 流程能跑通。
 * 依照 photoUri 字串的 hash 變化選擇不同 scenario，讓 demo 看起來「真的有辨識」。
 */

const SCENARIOS: { items: Array<{ name: string; category: ItemCategory; quantity: number }> }[] = [
  {
    items: [
      { name: '長袖襯衫', category: 'clothing', quantity: 5 },
      { name: '針織毛衣', category: 'clothing', quantity: 3 },
      { name: '牛仔褲', category: 'clothing', quantity: 2 },
    ],
  },
  {
    items: [
      { name: '技術書籍', category: 'books', quantity: 12 },
      { name: '筆記本', category: 'books', quantity: 4 },
      { name: '原子筆', category: 'books', quantity: 8 },
    ],
  },
  {
    items: [
      { name: 'USB-C 線', category: 'electronics', quantity: 4 },
      { name: '行動電源', category: 'electronics', quantity: 2 },
      { name: '充電器', category: 'electronics', quantity: 3 },
    ],
  },
  {
    items: [
      { name: '保鮮盒', category: 'kitchen', quantity: 6 },
      { name: '咖啡杯', category: 'kitchen', quantity: 3 },
      { name: '餐具組', category: 'kitchen', quantity: 1 },
    ],
  },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function mockRecognize(photoUri: string): Detection[] {
  const idx = hashString(photoUri) % SCENARIOS.length;
  const picked = SCENARIOS[idx] ?? SCENARIOS[0];
  if (!picked) return [];
  return picked.items.map((it, i): Detection => ({
    id: String(uuid.v4()),
    name: it.name,
    category: it.category,
    quantity: it.quantity,
    confidence: 0.85 - i * 0.1,
    sourceType: 'ai',
    bbox: {
      x: 0.05 + (i % 3) * 0.3,
      y: 0.1 + Math.floor(i / 3) * 0.35,
      w: 0.25,
      h: 0.3,
    },
    photoUri,
  }));
}
