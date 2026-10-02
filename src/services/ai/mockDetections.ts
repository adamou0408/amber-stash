import type { Detection } from '@/types/snapshot';
import { listFixtures } from '../detectionSource/fixtureSource';

/**
 * Mock 提案 — 沒有 API key 時用，讓 dev / demo 流程能跑通。
 * 依照 photoUri 字串的 hash 決定要拿哪個 fixture，確保同一張照片 → 同一組結果。
 *
 * 真正的 fixture 內容統一定義在 src/services/fixtures/detectionFixtures.json，
 * 與 fixtureSource 共用，避免出現兩份重複的 scenario 資料。
 */

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function mockRecognize(photoUri: string): Detection[] {
  const fixtures = listFixtures();
  if (fixtures.length === 0) return [];
  const idx = hashString(photoUri) % fixtures.length;
  const picked = fixtures[idx];
  if (!picked) return [];
  return picked.detections.map((d) => ({ ...d, photoUri }));
}
