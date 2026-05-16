/**
 * Pure-function tests for BboxOverlay's coordinate math.
 *
 * We test the math in bboxMath.ts rather than the React component because
 * RN gesture handlers / Animated values can't be exercised in node Jest env
 * without a heavy preset switch. The math IS the load-bearing piece.
 */
import {
  normalizedToPx,
  pxToNormalized,
  resizeBboxFromCorner,
  translateBbox,
  bboxStrokeForConfidence,
} from '@/services/bboxMath';

describe('normalizedToPx', () => {
  test('multiplies normalized coords by container size', () => {
    expect(normalizedToPx({ x: 0.5, y: 0.25, w: 0.1, h: 0.1 }, 200, 100)).toEqual({
      x: 100,
      y: 25,
      w: 20,
      h: 10,
    });
  });

  test('zero bbox stays zero', () => {
    expect(normalizedToPx({ x: 0, y: 0, w: 0, h: 0 }, 500, 500)).toEqual({
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    });
  });
});

describe('pxToNormalized', () => {
  test('divides by container size', () => {
    expect(pxToNormalized({ x: 100, y: 50, w: 50, h: 25 }, 200, 100)).toEqual({
      x: 0.5,
      y: 0.5,
      w: 0.25,
      h: 0.25,
    });
  });

  test('clamps values to [0,1]', () => {
    const out = pxToNormalized({ x: 300, y: -10, w: 500, h: 500 }, 200, 100);
    expect(out.x).toBe(1);
    expect(out.y).toBe(0);
    expect(out.w).toBe(1);
    expect(out.h).toBe(1);
  });

  test('returns zero bbox when container size is 0', () => {
    expect(pxToNormalized({ x: 50, y: 50, w: 10, h: 10 }, 0, 100)).toEqual({
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    });
  });
});

describe('resizeBboxFromCorner', () => {
  // Container is 200 x 200; bbox starts at (50, 50, 100, 100)
  // → normalized: (0.25, 0.25, 0.5, 0.5)
  const bbox = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };

  test('dragging top-left makes box bigger (anchor stays at bottom-right)', () => {
    // Move tl from (50,50) to (20, 30) → new rect should be (20, 30, 130, 120)
    const out = resizeBboxFromCorner(bbox, 'tl', 20, 30, 200, 200);
    expect(out.x).toBeCloseTo(0.1, 5);
    expect(out.y).toBeCloseTo(0.15, 5);
    expect(out.w).toBeCloseTo(0.65, 5);
    expect(out.h).toBeCloseTo(0.6, 5);
  });

  test('dragging bottom-right makes box bigger', () => {
    // Move br from (150,150) to (180, 200) → new rect (50, 50, 130, 150)
    const out = resizeBboxFromCorner(bbox, 'br', 180, 200, 200, 200);
    expect(out.x).toBeCloseTo(0.25, 5);
    expect(out.y).toBeCloseTo(0.25, 5);
    expect(out.w).toBeCloseTo(0.65, 5);
    expect(out.h).toBeCloseTo(0.75, 5);
  });

  test('dragging top-right inverts when going past top-left', () => {
    // tr from (150, 50) to (20, 20)
    // intermediate: left=50 right=20 top=20 → after flip left=20 right=50 top=20 bottom=150
    const out = resizeBboxFromCorner(bbox, 'tr', 20, 20, 200, 200);
    expect(out.x).toBeCloseTo(0.1, 5);
    expect(out.w).toBeCloseTo(0.15, 5);
  });

  test('clamps to container — cannot drag below 0', () => {
    const out = resizeBboxFromCorner(bbox, 'tl', -100, -100, 200, 200);
    expect(out.x).toBe(0);
    expect(out.y).toBe(0);
  });

  test('clamps to container — cannot drag beyond container', () => {
    const out = resizeBboxFromCorner(bbox, 'br', 500, 500, 200, 200);
    expect(out.x + out.w).toBeCloseTo(1, 5);
    expect(out.y + out.h).toBeCloseTo(1, 5);
  });

  test('returns input unchanged when container size is 0', () => {
    expect(resizeBboxFromCorner(bbox, 'br', 50, 50, 0, 0)).toEqual(bbox);
  });
});

describe('translateBbox', () => {
  const bbox = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };

  test('positive dx moves right; y unchanged', () => {
    const out = translateBbox(bbox, 20, 0, 200, 200);
    expect(out.x).toBeCloseTo(0.35, 5);
    expect(out.y).toBeCloseTo(0.25, 5);
    expect(out.w).toBeCloseTo(0.5, 5);
  });

  test('negative dy moves up', () => {
    const out = translateBbox(bbox, 0, -10, 200, 200);
    expect(out.y).toBeCloseTo(0.2, 5);
  });

  test('clamps to right edge — cannot go past container', () => {
    // Try to push far right; max x is 1 - w
    const out = translateBbox(bbox, 9999, 0, 200, 200);
    expect(out.x).toBeCloseTo(0.5, 5);
    expect(out.w).toBeCloseTo(0.5, 5);
  });

  test('clamps to left edge', () => {
    const out = translateBbox(bbox, -9999, 0, 200, 200);
    expect(out.x).toBe(0);
  });

  test('width and height never change during translation', () => {
    const out = translateBbox(bbox, 30, 30, 300, 300);
    expect(out.w).toBeCloseTo(bbox.w, 5);
    expect(out.h).toBeCloseTo(bbox.h, 5);
  });

  test('returns input unchanged when container size is 0', () => {
    expect(translateBbox(bbox, 10, 10, 0, 200)).toEqual(bbox);
  });
});

describe('bboxStrokeForConfidence', () => {
  test('confidence >= 0.6 returns high color', () => {
    expect(bboxStrokeForConfidence(0.6, '#amber', '#red')).toBe('#amber');
    expect(bboxStrokeForConfidence(0.9, '#amber', '#red')).toBe('#amber');
  });

  test('confidence < 0.6 returns low color', () => {
    expect(bboxStrokeForConfidence(0.59, '#amber', '#red')).toBe('#red');
    expect(bboxStrokeForConfidence(0, '#amber', '#red')).toBe('#red');
  });
});
