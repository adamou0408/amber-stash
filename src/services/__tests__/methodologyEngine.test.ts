import {
  buildContext,
  evaluate,
  runMethodology,
  runShoppingPicks,
} from '@/services/methodologyEngine';
import { DEFAULT_METHODOLOGY } from '@/services/methodologies/default';
import { KONMARI_METHODOLOGY } from '@/services/methodologies/konmari';
import type { Item, Space, UseFrequency } from '@/types';

function it_(
  name: string,
  category: Item['category'],
  quantity = 1,
  opts: { useFrequency?: UseFrequency; inGoldenZone?: boolean; spaceId?: string } = {},
): Item {
  return {
    id: `id-${name}`,
    name,
    category,
    quantity,
    useFrequency: opts.useFrequency,
    inGoldenZone: opts.inGoldenZone,
    spaceId: opts.spaceId,
    createdAt: 0,
    updatedAt: 0,
  };
}

function sp(kind: Space['kind'], name = 'space', opts: { capacityEstimate?: number; id?: string } = {}): Space {
  return {
    id: opts.id ?? `sp-${kind}`,
    name,
    kind,
    capacityEstimate: opts.capacityEstimate,
    createdAt: 0,
  };
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

describe('methodologyEngine — 收納師原則衍生條件（v4）', () => {
  test('buildContext aggregates useFrequency counts per category', () => {
    const ctx = buildContext(
      [
        it_('a', 'clothing', 3, { useFrequency: 'daily', inGoldenZone: true }),
        it_('b', 'clothing', 2, { useFrequency: 'daily', inGoldenZone: false }),
        it_('c', 'tools', 5, { useFrequency: 'rarely' }),
        it_('d', 'kitchen', 1), // unfrequented
      ],
      [],
    );
    expect(ctx.frequencyCounts.daily).toBe(5);
    expect(ctx.frequencyCounts.rarely).toBe(5);
    expect(ctx.zoneMismatchCounts.daily).toBe(2);
    expect(ctx.unfrequentedCount).toBe(1);
  });

  test('frequencyCount condition evaluates', () => {
    const ctx = buildContext([it_('a', 'clothing', 4, { useFrequency: 'daily' })], []);
    expect(evaluate({ type: 'frequencyCount', frequency: 'daily', op: '>=', value: 3 }, ctx)).toBe(true);
    expect(evaluate({ type: 'frequencyCount', frequency: 'daily', op: '>', value: 4 }, ctx)).toBe(false);
    expect(evaluate({ type: 'frequencyCount', frequency: 'rarely', op: '==', value: 0 }, ctx)).toBe(true);
  });

  test('overcapacity condition fires when fill ratio > threshold', () => {
    const wardrobe = sp('wardrobe', '衣櫃', { capacityEstimate: 10, id: 'w1' });
    const ctx = buildContext(
      [
        it_('a', 'clothing', 5, { spaceId: 'w1' }),
        it_('b', 'clothing', 4, { spaceId: 'w1' }),
      ],
      [wardrobe],
    );
    expect(ctx.spaceFillRatios['w1']).toBe(0.9);
    expect(evaluate({ type: 'overcapacity', ratio: 0.8 }, ctx)).toBe(true);
    expect(evaluate({ type: 'overcapacity', ratio: 0.95 }, ctx)).toBe(false);
  });

  test('overcapacity ignores spaces without capacityEstimate', () => {
    const wardrobe = sp('wardrobe', '衣櫃', { id: 'w1' }); // no capacity
    const ctx = buildContext(
      [it_('a', 'clothing', 100, { spaceId: 'w1' })],
      [wardrobe],
    );
    expect(ctx.spaceFillRatios).toEqual({});
    expect(evaluate({ type: 'overcapacity', ratio: 0.8 }, ctx)).toBe(false);
  });

  test('zoneMismatch condition counts daily items not in golden zone', () => {
    const ctx = buildContext(
      [
        it_('a', 'electronics', 2, { useFrequency: 'daily', inGoldenZone: true }), // good
        it_('b', 'tools', 3, { useFrequency: 'daily', inGoldenZone: false }), // mismatch
        it_('c', 'tools', 2, { useFrequency: 'daily' }), // no flag = mismatch
      ],
      [],
    );
    expect(ctx.zoneMismatchCounts.daily).toBe(5);
    expect(evaluate({ type: 'zoneMismatch', frequency: 'daily', op: '>=', value: 3 }, ctx)).toBe(true);
    expect(evaluate({ type: 'zoneMismatch', frequency: 'daily', op: '==', value: 0 }, ctx)).toBe(false);
  });

  test('unfrequented condition counts items without useFrequency', () => {
    const ctx = buildContext(
      [
        it_('a', 'clothing', 4, { useFrequency: 'daily' }), // frequented
        it_('b', 'books', 7), // unfrequented
        it_('c', 'tools', 2), // unfrequented
      ],
      [],
    );
    expect(ctx.unfrequentedCount).toBe(9);
    expect(evaluate({ type: 'unfrequented', op: '>=', value: 5 }, ctx)).toBe(true);
  });

  test('default methodology fires capacity-80 when space is overcrowded', () => {
    const drawer = sp('drawer', '抽屜', { capacityEstimate: 10, id: 'd1' });
    const items = Array.from({ length: 9 }, (_, i) =>
      it_(`x${i}`, 'tools', 1, { spaceId: 'd1' }),
    );
    const out = runMethodology(DEFAULT_METHODOLOGY, items, [drawer]);
    expect(out.find((s) => s.id.endsWith('::capacity-80-warning'))).toBeDefined();
  });

  test('default methodology fires zone-mismatch-daily when 3+ daily items outside golden zone', () => {
    const items = [
      it_('keys', 'tools', 1, { useFrequency: 'daily', inGoldenZone: false }),
      it_('phone-charger', 'electronics', 1, { useFrequency: 'daily', inGoldenZone: false }),
      it_('wallet', 'tools', 1, { useFrequency: 'daily', inGoldenZone: false }),
    ];
    const out = runMethodology(DEFAULT_METHODOLOGY, items, []);
    const mismatch = out.find((s) => s.id.endsWith('::zone-mismatch-daily'));
    expect(mismatch).toBeDefined();
    expect(mismatch?.title).toContain('3');
  });

  test('default methodology gives positive feedback when all daily items in golden zone', () => {
    const items = [
      it_('keys', 'tools', 1, { useFrequency: 'daily', inGoldenZone: true }),
      it_('phone', 'electronics', 1, { useFrequency: 'daily', inGoldenZone: true }),
      it_('wallet', 'tools', 1, { useFrequency: 'daily', inGoldenZone: true }),
    ];
    const out = runMethodology(DEFAULT_METHODOLOGY, items, []);
    expect(out.find((s) => s.id.endsWith('::daily-zone-good'))).toBeDefined();
  });

  test('default methodology fires unfrequented-many when 5+ items lack frequency', () => {
    const items = Array.from({ length: 6 }, (_, i) => it_(`x${i}`, 'tools', 1));
    const out = runMethodology(DEFAULT_METHODOLOGY, items, []);
    expect(out.find((s) => s.id.endsWith('::unfrequented-many'))).toBeDefined();
  });

  test('default methodology fires rarely-many when 8+ rarely items exist', () => {
    const items = Array.from({ length: 8 }, (_, i) =>
      it_(`x${i}`, 'tools', 1, { useFrequency: 'rarely' }),
    );
    const out = runMethodology(DEFAULT_METHODOLOGY, items, []);
    expect(out.find((s) => s.id.endsWith('::rarely-many'))).toBeDefined();
  });
});
