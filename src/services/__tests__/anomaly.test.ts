import { DEFAULT_ANOMALY_RATIO, detectAnomalies } from '@/services/anomaly';
import type { Detection, SpaceSnapshot } from '@/types/snapshot';

function det(category: Detection['category'], quantity: number, id = 'd'): Detection {
  return {
    id,
    name: 'thing',
    category,
    quantity,
    confidence: 1,
    sourceType: 'manual',
  };
}

function snap(detections: Detection[]): SpaceSnapshot {
  return {
    id: 'snap-1',
    spaceId: 'space-1',
    sourceSessionId: 'sess-1',
    detections,
    createdAt: 1,
  };
}

describe('detectAnomalies', () => {
  test('no previous snapshot → no anomalies', () => {
    expect(detectAnomalies([det('clothing', 100)], null)).toEqual([]);
  });

  test('current ≤ previous → no anomalies', () => {
    const prev = snap([det('clothing', 10)]);
    expect(detectAnomalies([det('clothing', 10)], prev)).toEqual([]);
    expect(detectAnomalies([det('clothing', 5)], prev)).toEqual([]);
  });

  test('previous = 0 → never anomaly (first time recording)', () => {
    const prev = snap([det('tools', 1)]);
    // clothing wasn't recorded before
    expect(detectAnomalies([det('clothing', 100)], prev)).toEqual([]);
  });

  test('current exactly 3x previous → NOT anomaly (strictly greater than)', () => {
    const prev = snap([det('clothing', 4)]);
    expect(detectAnomalies([det('clothing', 12)], prev, DEFAULT_ANOMALY_RATIO)).toEqual([]);
  });

  test('current > 3x previous → flagged', () => {
    const prev = snap([det('clothing', 4)]);
    const out = detectAnomalies([det('clothing', 13)], prev);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      category: 'clothing',
      previousQuantity: 4,
      currentQuantity: 13,
    });
    expect(out[0]?.ratio).toBeGreaterThan(3);
  });

  test('aggregates by category across multiple detections', () => {
    const prev = snap([det('books', 2, 'p1'), det('books', 1, 'p2')]); // prev total = 3
    const cur = [det('books', 5, 'c1'), det('books', 5, 'c2')]; // cur total = 10 (> 3 * 3 = 9)
    const out = detectAnomalies(cur, prev);
    expect(out).toHaveLength(1);
    expect(out[0]?.category).toBe('books');
  });

  test('custom ratio threshold respected', () => {
    const prev = snap([det('toys', 2)]);
    // 5 / 2 = 2.5; with ratio 2 → anomaly; with default 3 → no
    expect(detectAnomalies([det('toys', 5)], prev, 2)).toHaveLength(1);
    expect(detectAnomalies([det('toys', 5)], prev)).toHaveLength(0);
  });

  test('multiple anomalies returned in one call', () => {
    const prev = snap([det('clothing', 1, 'a'), det('books', 2, 'b')]);
    const cur = [det('clothing', 10, 'x'), det('books', 100, 'y')];
    const out = detectAnomalies(cur, prev);
    const cats = out.map((a) => a.category).sort();
    expect(cats).toEqual(['books', 'clothing']);
  });
});
