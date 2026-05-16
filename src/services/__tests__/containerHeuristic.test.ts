import {
  isContainerCandidate,
  pickContainerCandidate,
  markAsContainerOnly,
  CONTAINER_KEYWORD_LIST,
} from '@/services/containerHeuristic';
import type { Detection } from '@/types/snapshot';
import type { ItemCategory } from '@/types';

function det(overrides: Partial<Detection> & Pick<Detection, 'id'>): Detection {
  return {
    id: overrides.id,
    name: overrides.name ?? '',
    category: overrides.category ?? 'other',
    quantity: overrides.quantity ?? 1,
    confidence: overrides.confidence ?? 0.9,
    sourceType: overrides.sourceType ?? 'ai',
    bbox: overrides.bbox,
    photoUri: overrides.photoUri,
    note: overrides.note,
  };
}

describe('isContainerCandidate', () => {
  test('toys category with 盒 in name is NOT a container (only tools/other count)', () => {
    expect(isContainerCandidate({ name: '玩具收納盒', category: 'toys' })).toBe(false);
  });

  test('tools category with 盒 in name is a container', () => {
    expect(isContainerCandidate({ name: '工具收納盒', category: 'tools' })).toBe(true);
  });

  test('other category with 箱 in name is a container', () => {
    expect(isContainerCandidate({ name: '雜物收納箱', category: 'other' })).toBe(true);
  });

  test('other category with 籃 in name is a container', () => {
    expect(isContainerCandidate({ name: '藤編收納籃', category: 'other' })).toBe(true);
  });

  test('other category with 籮 in name is a container', () => {
    expect(isContainerCandidate({ name: '竹籮筐', category: 'other' })).toBe(true);
  });

  test('other category with 筐 in name is a container', () => {
    expect(isContainerCandidate({ name: '塑膠筐', category: 'other' })).toBe(true);
  });

  test('tools category without keyword is NOT a container', () => {
    expect(isContainerCandidate({ name: '螺絲起子', category: 'tools' })).toBe(false);
  });

  test('clothing category never triggers container detection', () => {
    expect(isContainerCandidate({ name: '收納盒', category: 'clothing' })).toBe(false);
  });

  test('kitchen 盒子 NOT a container — kitchen has its own categorisation', () => {
    expect(isContainerCandidate({ name: '保鮮盒', category: 'kitchen' })).toBe(false);
  });

  test('empty name returns false', () => {
    expect(isContainerCandidate({ name: '', category: 'other' })).toBe(false);
  });

  test('all keywords are detected', () => {
    for (const kw of CONTAINER_KEYWORD_LIST) {
      expect(isContainerCandidate({ name: `測試${kw}`, category: 'other' })).toBe(true);
    }
  });
});

describe('pickContainerCandidate', () => {
  test('returns null on empty list', () => {
    expect(pickContainerCandidate([])).toBeNull();
  });

  test('returns null when nothing matches', () => {
    const out = pickContainerCandidate([
      det({ id: 'a', name: '螺絲起子', category: 'tools' }),
      det({ id: 'b', name: '杯子', category: 'kitchen' }),
    ]);
    expect(out).toBeNull();
  });

  test('returns the first matching container', () => {
    const containerA = det({ id: 'a', name: '工具收納盒', category: 'tools' });
    const containerB = det({ id: 'b', name: '雜物收納籃', category: 'other' });
    const out = pickContainerCandidate([
      det({ id: 'c', name: '螺絲起子', category: 'tools' }),
      containerA,
      containerB,
    ]);
    expect(out?.id).toBe('a');
  });

  test('does not mutate input list', () => {
    const list = [
      det({ id: 'a', name: '工具收納盒', category: 'tools' }),
    ];
    const snap = JSON.parse(JSON.stringify(list)) as Detection[];
    pickContainerCandidate(list);
    expect(JSON.parse(JSON.stringify(list))).toEqual(snap);
  });
});

describe('markAsContainerOnly', () => {
  test('adds (容器) note when none present', () => {
    const d = det({ id: 'a', name: '收納盒', category: 'other' });
    const out = markAsContainerOnly(d);
    expect(out.note).toBe('(容器)');
  });

  test('appends (容器) to existing note', () => {
    const d = det({ id: 'a', name: '收納盒', category: 'other', note: '從 IKEA 買的' });
    const out = markAsContainerOnly(d);
    expect(out.note).toBe('從 IKEA 買的 (容器)');
  });

  test('idempotent — does not double-add the tag', () => {
    const d = det({ id: 'a', name: '收納盒', category: 'other', note: '從 IKEA 買的 (容器)' });
    const out = markAsContainerOnly(d);
    expect(out.note).toBe('從 IKEA 買的 (容器)');
  });

  test('does not mutate input', () => {
    const d = det({ id: 'a', name: '收納盒', category: 'other' });
    const snap = JSON.parse(JSON.stringify(d)) as Detection;
    markAsContainerOnly(d);
    expect(JSON.parse(JSON.stringify(d))).toEqual(snap);
  });

  test('preserves all other fields', () => {
    const d = det({
      id: 'a',
      name: '收納盒',
      category: 'other' as ItemCategory,
      quantity: 5,
      confidence: 0.4,
      photoUri: 'x.jpg',
      bbox: { x: 0.1, y: 0.1, w: 0.5, h: 0.5 },
    });
    const out = markAsContainerOnly(d);
    expect(out.id).toBe('a');
    expect(out.quantity).toBe(5);
    expect(out.bbox).toEqual({ x: 0.1, y: 0.1, w: 0.5, h: 0.5 });
  });
});
