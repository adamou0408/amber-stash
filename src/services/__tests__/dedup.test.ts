import { DEFAULT_IOU_THRESHOLD, dedupeByIOU, iou, mergeDetections } from '@/services/dedup';
import type { BBox, Detection } from '@/types/snapshot';

function det(
  overrides: Partial<Detection> & Pick<Detection, 'id' | 'category'> & { bbox?: BBox },
): Detection {
  return {
    id: overrides.id,
    name: overrides.name ?? 'thing',
    category: overrides.category,
    quantity: overrides.quantity ?? 1,
    confidence: overrides.confidence ?? 0.9,
    sourceType: overrides.sourceType ?? 'ai',
    bbox: overrides.bbox,
    photoUri: overrides.photoUri,
    note: overrides.note,
  };
}

describe('iou', () => {
  test('zero overlap returns 0', () => {
    expect(iou({ x: 0, y: 0, w: 10, h: 10 }, { x: 100, y: 100, w: 10, h: 10 })).toBe(0);
  });

  test('exact match returns 1', () => {
    const a: BBox = { x: 0, y: 0, w: 10, h: 10 };
    expect(iou(a, { ...a })).toBe(1);
  });

  test('half overlap on x axis returns 1/3', () => {
    // A = [0,0..10,10], B = [5,0..15,10] → inter = 5*10 = 50, union = 100+100-50 = 150
    const v = iou({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 0, w: 10, h: 10 });
    expect(v).toBeCloseTo(50 / 150, 5);
  });

  test('zero-width bbox returns 0', () => {
    expect(iou({ x: 0, y: 0, w: 0, h: 10 }, { x: 0, y: 0, w: 10, h: 10 })).toBe(0);
  });

  test('touching but not overlapping returns 0', () => {
    expect(iou({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(0);
  });
});

describe('dedupeByIOU — boundary', () => {
  test('empty input → empty output', () => {
    expect(dedupeByIOU([])).toEqual([]);
  });

  test('IOU exactly at threshold (= 0.5) is NOT merged (strictly greater)', () => {
    // Construct two bboxes with IOU exactly 1/3 (< 0.5) and another pair with IOU > 0.5
    // Use IOU = 0.5 case: A=[0,0,10,10], B=[5,0,5,10] → inter=5*10=50, union=100+50-50=100 → 0.5
    const a = det({ id: 'a', category: 'clothing', bbox: { x: 0, y: 0, w: 10, h: 10 } });
    const b = det({ id: 'b', category: 'clothing', bbox: { x: 5, y: 0, w: 5, h: 10 } });
    expect(iou(a.bbox!, b.bbox!)).toBeCloseTo(0.5, 5);
    const merged = dedupeByIOU([a, b], DEFAULT_IOU_THRESHOLD);
    expect(merged).toHaveLength(2);
  });

  test('IOU above threshold merges same category', () => {
    const a = det({
      id: 'a',
      category: 'clothing',
      bbox: { x: 0, y: 0, w: 10, h: 10 },
      confidence: 0.7,
    });
    const b = det({
      id: 'b',
      category: 'clothing',
      bbox: { x: 1, y: 1, w: 10, h: 10 },
      confidence: 0.9,
    });
    // big IOU
    expect(iou(a.bbox!, b.bbox!)).toBeGreaterThan(0.5);
    const out = dedupeByIOU([a, b]);
    expect(out).toHaveLength(1);
    // higher confidence wins identity
    expect(out[0]?.id).toBe('b');
    expect(out[0]?.quantity).toBe(2);
  });

  test('different categories are NOT merged even when bboxes overlap', () => {
    const a = det({ id: 'a', category: 'clothing', bbox: { x: 0, y: 0, w: 10, h: 10 } });
    const b = det({ id: 'b', category: 'tools', bbox: { x: 0, y: 0, w: 10, h: 10 } });
    const out = dedupeByIOU([a, b]);
    expect(out).toHaveLength(2);
  });

  test('detections without bbox are kept separately', () => {
    const a = det({ id: 'a', category: 'clothing' });
    const b = det({ id: 'b', category: 'clothing' });
    expect(dedupeByIOU([a, b])).toHaveLength(2);
  });

  test('3 overlapping detections collapse to 1 (acceptance: 連拍 3 張同物 → 1 件)', () => {
    const a = det({
      id: 'a',
      category: 'clothing',
      bbox: { x: 0, y: 0, w: 100, h: 100 },
      confidence: 0.6,
    });
    const b = det({
      id: 'b',
      category: 'clothing',
      bbox: { x: 2, y: 2, w: 100, h: 100 },
      confidence: 0.8,
    });
    const c = det({
      id: 'c',
      category: 'clothing',
      bbox: { x: 4, y: 4, w: 100, h: 100 },
      confidence: 0.95,
    });
    const out = dedupeByIOU([a, b, c]);
    expect(out).toHaveLength(1);
    expect(out[0]?.quantity).toBe(3);
    expect(out[0]?.id).toBe('c'); // highest confidence wins
  });

  test('purity: does not mutate input', () => {
    const a = det({
      id: 'a',
      category: 'clothing',
      bbox: { x: 0, y: 0, w: 10, h: 10 },
      quantity: 1,
    });
    const b = det({
      id: 'b',
      category: 'clothing',
      bbox: { x: 1, y: 1, w: 10, h: 10 },
      quantity: 1,
    });
    const snap = JSON.parse(JSON.stringify([a, b])) as Detection[];
    dedupeByIOU([a, b]);
    expect(JSON.parse(JSON.stringify([a, b]))).toEqual(snap);
  });
});

describe('mergeDetections', () => {
  test('quantity sums, confidence is the max', () => {
    const a = det({ id: 'a', category: 'clothing', quantity: 2, confidence: 0.3 });
    const b = det({ id: 'b', category: 'clothing', quantity: 5, confidence: 0.8 });
    const m = mergeDetections(a, b);
    expect(m.quantity).toBe(7);
    expect(m.confidence).toBe(0.8);
    expect(m.id).toBe('b');
  });
});
