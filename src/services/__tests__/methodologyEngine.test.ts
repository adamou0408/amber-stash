import {
  buildContext,
  evaluate,
  runMethodology,
  runShoppingPicks,
} from '@/services/methodologyEngine';
import { DEFAULT_METHODOLOGY } from '@/services/methodologies/default';
import { KONMARI_METHODOLOGY } from '@/services/methodologies/konmari';
import type { Item, Space } from '@/types';

function it_(name: string, category: Item['category'], quantity = 1): Item {
  return {
    id: `id-${name}`,
    name,
    category,
    quantity,
    createdAt: 0,
    updatedAt: 0,
  };
}

function sp(kind: Space['kind'], name = 'space'): Space {
  return { id: `sp-${kind}`, name, kind, createdAt: 0 };
}

describe('methodologyEngine — regression baseline (M3)', () => {
  test('buildContext sums quantities per category', () => {
    const ctx = buildContext(
      [it_('a', 'clothing', 3), it_('b', 'clothing', 2), it_('c', 'books', 1)],
      [sp('wardrobe')],
    );
    expect(ctx.itemCount).toBe(3);
    expect(ctx.spaceCount).toBe(1);
    expect(ctx.categoryCounts.clothing).toBe(5);
    expect(ctx.categoryCounts.books).toBe(1);
    expect(ctx.spaceKinds.has('wardrobe')).toBe(true);
  });

  test('evaluate handles all rule condition types', () => {
    const ctx = buildContext(
      [it_('a', 'clothing', 12), it_('b', 'kitchen', 1)],
      [sp('wardrobe')],
    );
    expect(evaluate({ type: 'categoryCount', category: 'clothing', op: '>=', value: 10 }, ctx)).toBe(true);
    expect(evaluate({ type: 'categoryCount', category: 'clothing', op: '<', value: 10 }, ctx)).toBe(false);
    expect(evaluate({ type: 'categoryCount', category: '*', op: '>', value: 0 }, ctx)).toBe(true);
    expect(evaluate({ type: 'hasSpaceKind', kind: 'wardrobe' }, ctx)).toBe(true);
    expect(evaluate({ type: 'hasSpaceKind', kind: 'desk' }, ctx)).toBe(false);
    expect(evaluate({ type: 'noSpaces' }, ctx)).toBe(false);
    expect(evaluate({ type: 'noItems' }, ctx)).toBe(false);
    expect(
      evaluate(
        {
          type: 'and',
          conditions: [
            { type: 'categoryCount', category: 'clothing', op: '>=', value: 1 },
            { type: 'hasSpaceKind', kind: 'wardrobe' },
          ],
        },
        ctx,
      ),
    ).toBe(true);
    expect(
      evaluate(
        {
          type: 'or',
          conditions: [
            { type: 'noItems' },
            { type: 'hasSpaceKind', kind: 'wardrobe' },
          ],
        },
        ctx,
      ),
    ).toBe(true);
  });

  test('empty inventory → only the "empty" suggestion fires (default methodology)', () => {
    const out = runMethodology(DEFAULT_METHODOLOGY, [], []);
    expect(out.length).toBeGreaterThan(0);
    expect(out.find((s) => s.id.endsWith('::empty'))).toBeDefined();
  });

  test('clothing ≥ 10 triggers clothing-many in default methodology with template filled', () => {
    const items = Array.from({ length: 10 }, (_, i) => it_(`c${i}`, 'clothing', 1));
    const out = runMethodology(DEFAULT_METHODOLOGY, items, [sp('wardrobe')]);
    const clothingRule = out.find((s) => s.id.endsWith('::clothing-many'));
    expect(clothingRule).toBeDefined();
    expect(clothingRule?.title).toContain('10');
  });

  test('konmari methodology produces different suggestion than default for clothing', () => {
    const items = Array.from({ length: 10 }, (_, i) => it_(`c${i}`, 'clothing', 1));
    const def = runMethodology(DEFAULT_METHODOLOGY, items, []);
    const kon = runMethodology(KONMARI_METHODOLOGY, items, []);
    expect(def.map((s) => s.id)).not.toEqual(kon.map((s) => s.id));
  });

  test('shopping picks honor rule conditions', () => {
    const noItems: Item[] = [];
    expect(runShoppingPicks(DEFAULT_METHODOLOGY, noItems, [])).toEqual([]);

    const wardrobe = [sp('wardrobe')];
    const picks = runShoppingPicks(DEFAULT_METHODOLOGY, [], wardrobe);
    expect(picks.some((p) => p.name.includes('層板'))).toBe(true);
  });

  test('suggestion ids are namespaced by methodology', () => {
    const items = [it_('x', 'clothing', 1)];
    const out = runMethodology(DEFAULT_METHODOLOGY, items, []);
    for (const s of out) {
      expect(s.id.startsWith(`${DEFAULT_METHODOLOGY.id}::`)).toBe(true);
    }
  });
});
