import {
  buildContext,
  evaluate,
  runMethodology,
  runShoppingPicks,
} from '@/services/methodologyEngine';
import { DEFAULT_METHODOLOGY } from '@/services/methodologies/default';
import { KONMARI_METHODOLOGY } from '@/services/methodologies/konmari';
import { DANSHARI_METHODOLOGY } from '@/services/methodologies/danshari';
import { HOME_EDIT_METHODOLOGY } from '@/services/methodologies/homeEdit';
import { ALL_METHODOLOGIES, methodologyForPhase } from '@/services/methodologies';
import type { Item, ItemColor, Space, UseFrequency, VisibilityTier } from '@/types';

function it_(
  name: string,
  category: Item['category'],
  quantity = 1,
  opts: {
    useFrequency?: UseFrequency;
    inGoldenZone?: boolean;
    spaceId?: string;
    color?: ItemColor;
    visibilityTier?: VisibilityTier;
  } = {},
): Item {
  return {
    id: `id-${name}-${Math.random().toString(36).slice(2)}`,
    name,
    category,
    quantity,
    useFrequency: opts.useFrequency,
    inGoldenZone: opts.inGoldenZone,
    spaceId: opts.spaceId,
    color: opts.color,
    visibilityTier: opts.visibilityTier,
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

describe('methodologyEngine — 多派擴充（v4 五派共存）', () => {
  test('buildContext computes color counts and category color diversity', () => {
    const ctx = buildContext(
      [
        it_('shirt-red', 'clothing', 2, { color: 'red' }),
        it_('shirt-blue', 'clothing', 3, { color: 'blue' }),
        it_('shirt-green', 'clothing', 1, { color: 'green' }),
        it_('book-red', 'books', 1, { color: 'red' }),
      ],
      [],
    );
    expect(ctx.colorCounts.red).toBe(3);
    expect(ctx.colorCounts.blue).toBe(3);
    expect(ctx.colorCounts.green).toBe(1);
    expect(ctx.categoryColorDiversity.clothing).toBe(3);
    expect(ctx.categoryColorDiversity.books).toBe(1);
    expect(ctx.dominantColor).toMatch(/red|blue/);
  });

  test('colorDiversity condition fires for clothing with 4+ colors', () => {
    const items = [
      it_('a', 'clothing', 1, { color: 'red' }),
      it_('b', 'clothing', 1, { color: 'blue' }),
      it_('c', 'clothing', 1, { color: 'green' }),
      it_('d', 'clothing', 1, { color: 'yellow' }),
    ];
    const ctx = buildContext(items, []);
    expect(evaluate({ type: 'colorDiversity', category: 'clothing', op: '>=', value: 4 }, ctx)).toBe(true);
    expect(evaluate({ type: 'colorDiversity', category: 'clothing', op: '>=', value: 5 }, ctx)).toBe(false);
  });

  test('colorCount condition fires for specific color thresholds', () => {
    const items = [
      it_('a', 'clothing', 5, { color: 'white' }),
      it_('b', 'clothing', 7, { color: 'white' }),
    ];
    const ctx = buildContext(items, []);
    expect(ctx.colorCounts.white).toBe(12);
    expect(evaluate({ type: 'colorCount', color: 'white', op: '>=', value: 10 }, ctx)).toBe(true);
    expect(evaluate({ type: 'colorCount', color: 'red', op: '>=', value: 1 }, ctx)).toBe(false);
  });

  test('tierRatios sum to 1 when all items have tiers', () => {
    const items = [
      it_('a', 'clothing', 7, { visibilityTier: 'show' }),
      it_('b', 'clothing', 2, { visibilityTier: 'stored' }),
      it_('c', 'clothing', 1, { visibilityTier: 'shrine' }),
    ];
    const ctx = buildContext(items, []);
    expect(ctx.tierRatios.show).toBeCloseTo(0.7);
    expect(ctx.tierRatios.stored).toBeCloseTo(0.2);
    expect(ctx.tierRatios.shrine).toBeCloseTo(0.1);
  });

  test('tierExceeds fires when actual exceeds target by margin', () => {
    // show target = 0.7; we set 9/10 = 0.9 → excess 0.2
    const items = [
      ...Array.from({ length: 9 }, (_, i) =>
        it_(`s${i}`, 'clothing', 1, { visibilityTier: 'show' }),
      ),
      it_('stored', 'clothing', 1, { visibilityTier: 'stored' }),
    ];
    const ctx = buildContext(items, []);
    expect(evaluate({ type: 'tierExceeds', tier: 'show', value: 0, op: '>' }, ctx)).toBe(true);
    expect(evaluate({ type: 'tierExceeds', tier: 'show', value: 0.3, op: '>' }, ctx)).toBe(false);
  });

  test('untieredCount condition fires when items lack visibilityTier', () => {
    const items = [
      it_('with-tier', 'tools', 1, { visibilityTier: 'show' }),
      it_('no-tier-1', 'tools', 3),
      it_('no-tier-2', 'tools', 2),
    ];
    const ctx = buildContext(items, []);
    expect(ctx.untieredCount).toBe(5);
    expect(evaluate({ type: 'untieredCount', op: '>=', value: 5 }, ctx)).toBe(true);
  });

  test('danshari methodology fires core-question for any items', () => {
    const items = [it_('x', 'clothing', 3)];
    const out = runMethodology(DANSHARI_METHODOLOGY, items, []);
    expect(out.find((s) => s.id.endsWith('::core-question'))).toBeDefined();
  });

  test('danshari methodology fires tier-show-overcrowd when show > 70%', () => {
    const items = [
      ...Array.from({ length: 9 }, (_, i) =>
        it_(`s${i}`, 'clothing', 1, { visibilityTier: 'show' }),
      ),
      it_('stored', 'clothing', 1, { visibilityTier: 'stored' }),
    ];
    const out = runMethodology(DANSHARI_METHODOLOGY, items, []);
    const rule = out.find((s) => s.id.endsWith('::tier-show-overcrowd'));
    expect(rule).toBeDefined();
    expect(rule?.title).toContain('%');
  });

  test('konmari methodology fires order-clothing first when clothing exists', () => {
    const items = [it_('shirt', 'clothing', 5)];
    const out = runMethodology(KONMARI_METHODOLOGY, items, []);
    expect(out[0]?.id.endsWith('::order-clothing')).toBe(true);
  });

  test('konmari methodology fires color-group when clothing has 4+ colors', () => {
    const items = [
      ...Array.from({ length: 10 }, (_, i) => it_(`c${i}`, 'clothing', 1, { color: 'red' })),
      it_('a', 'clothing', 1, { color: 'blue' }),
      it_('b', 'clothing', 1, { color: 'green' }),
      it_('c', 'clothing', 1, { color: 'yellow' }),
    ];
    const out = runMethodology(KONMARI_METHODOLOGY, items, []);
    expect(out.find((s) => s.id.endsWith('::color-group'))).toBeDefined();
  });

  test('home-edit methodology fires rainbow-clothing when 15+ items, 4+ colors', () => {
    const items = [
      ...Array.from({ length: 5 }, (_, i) => it_(`r${i}`, 'clothing', 1, { color: 'red' })),
      ...Array.from({ length: 5 }, (_, i) => it_(`b${i}`, 'clothing', 1, { color: 'blue' })),
      ...Array.from({ length: 3 }, (_, i) => it_(`g${i}`, 'clothing', 1, { color: 'green' })),
      ...Array.from({ length: 3 }, (_, i) => it_(`y${i}`, 'clothing', 1, { color: 'yellow' })),
    ];
    const out = runMethodology(HOME_EDIT_METHODOLOGY, items, []);
    expect(out.find((s) => s.id.endsWith('::rainbow-clothing'))).toBeDefined();
  });

  test('home-edit methodology suppresses rainbow when colorDiversity < 4', () => {
    const items = Array.from({ length: 15 }, (_, i) =>
      it_(`r${i}`, 'clothing', 1, { color: i < 8 ? 'red' : 'blue' }),
    );
    const out = runMethodology(HOME_EDIT_METHODOLOGY, items, []);
    expect(out.find((s) => s.id.endsWith('::rainbow-clothing'))).toBeUndefined();
    expect(out.find((s) => s.id.endsWith('::low-diversity-noop'))).toBeDefined();
  });

  test('home-edit methodology fires edit-before-aesthetic when 10+ rarely items', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      it_(`r${i}`, 'tools', 1, { useFrequency: 'rarely' }),
    );
    const out = runMethodology(HOME_EDIT_METHODOLOGY, items, []);
    expect(out.find((s) => s.id.endsWith('::edit-before-aesthetic'))).toBeDefined();
  });

  test('all 6 methodologies are registered, covering 5 distinct lifecycle phases', () => {
    expect(ALL_METHODOLOGIES.length).toBe(6);
    const phases = new Set(ALL_METHODOLOGIES.map((m) => m.lifecyclePhase));
    expect(phases.size).toBe(5);
    expect(phases.has('mindset')).toBe(true);
    expect(phases.has('deep-clean')).toBe(true);
    expect(phases.has('maintenance')).toBe(true);
    expect(phases.has('aesthetic')).toBe(true);
    expect(phases.has('gentle-reset')).toBe(true);
  });

  test('methodologyForPhase returns correct methodology', () => {
    expect(methodologyForPhase('mindset').id).toBe(DANSHARI_METHODOLOGY.id);
    expect(methodologyForPhase('deep-clean').id).toBe(KONMARI_METHODOLOGY.id);
    expect(methodologyForPhase('maintenance').id).toBe(DEFAULT_METHODOLOGY.id);
    expect(methodologyForPhase('aesthetic').id).toBe(HOME_EDIT_METHODOLOGY.id);
  });

  test('every methodology has at least one rule for empty inventory', () => {
    for (const m of ALL_METHODOLOGIES) {
      const out = runMethodology(m, [], []);
      expect(out.length).toBeGreaterThan(0);
    }
  });

  test('switching methodology produces different suggestions for same items', () => {
    const items = [
      it_('shirt', 'clothing', 12, { color: 'red', visibilityTier: 'show' }),
      it_('book', 'books', 8),
    ];
    const sets = ALL_METHODOLOGIES.map((m) =>
      new Set(runMethodology(m, items, []).map((s) => s.id)),
    );
    // At least 4 of 6 should be distinct
    const distinct = new Set(sets.map((s) => Array.from(s).sort().join('|')));
    expect(distinct.size).toBeGreaterThanOrEqual(4);
  });
});

describe('methodologyEngine — 廖心筠 + 寬容派擴張（v4 六派共存）', () => {
  test('all 6 methodologies registered, 5 distinct lifecycle phases (maintenance has 2)', async () => {
    // dynamic import to avoid hoisting issues
    const mod = await import('@/services/methodologies');
    expect(mod.ALL_METHODOLOGIES.length).toBe(6);
    const phases = new Set(mod.ALL_METHODOLOGIES.map((m) => m.lifecyclePhase));
    expect(phases.size).toBe(5);
    expect(phases.has('gentle-reset')).toBe(true);
    expect(mod.methodologiesForPhase('maintenance').length).toBe(2); // default + 廖心筠
  });

  test('unassociatedCount counts items without associationHint', () => {
    const items = [
      it_('a', 'tools', 3),
      it_('b', 'tools', 2),
    ];
    items[0].associationHint = '口罩、悠遊卡';
    const ctx = buildContext(items, []);
    expect(ctx.unassociatedCount).toBe(2);
    expect(evaluate({ type: 'unassociatedCount', op: '>=', value: 2 }, ctx)).toBe(true);
    expect(evaluate({ type: 'unassociatedCount', op: '>=', value: 3 }, ctx)).toBe(false);
  });

  test('heirloomCount counts isHeirloom items by quantity', () => {
    const items = [
      it_('grandma-watch', 'sentimental', 1),
      it_('great-vase', 'sentimental', 2),
      it_('regular', 'sentimental', 5),
    ];
    items[0].isHeirloom = true;
    items[1].isHeirloom = true;
    const ctx = buildContext(items, []);
    expect(ctx.heirloomCount).toBe(3);
    expect(evaluate({ type: 'heirloomCount', op: '>=', value: 1 }, ctx)).toBe(true);
    expect(evaluate({ type: 'heirloomCount', op: '<', value: 10 }, ctx)).toBe(true);
  });

  test('liaohsinyun methodology fires association-design for many unassociated items', async () => {
    const mod = await import('@/services/methodologies/liaohsinyun');
    const items = Array.from({ length: 6 }, (_, i) => it_(`x${i}`, 'tools', 1));
    const out = runMethodology(mod.LIAOHSINYUN_METHODOLOGY, items, []);
    expect(out.find((s) => s.id.endsWith('::association-design'))).toBeDefined();
  });

  test('liaohsinyun methodology fires heirloom-gentle when heirloom flag set', async () => {
    const mod = await import('@/services/methodologies/liaohsinyun');
    const item = it_('grandma-watch', 'sentimental', 1);
    item.isHeirloom = true;
    const out = runMethodology(mod.LIAOHSINYUN_METHODOLOGY, [item], []);
    const rule = out.find((s) => s.id.endsWith('::heirloom-gentle'));
    expect(rule).toBeDefined();
    expect(rule?.title).toContain('家族傳承');
    expect(rule?.body).toContain('祖傳');
  });

  test('gentle (KC Davis) methodology fires morally-neutral as top priority', async () => {
    const mod = await import('@/services/methodologies/gentle');
    const out = runMethodology(mod.GENTLE_METHODOLOGY, [it_('x', 'tools', 5)], []);
    expect(out[0]?.id.endsWith('::morally-neutral')).toBe(true);
  });

  test('gentle methodology fires five-things when ≥5 items', async () => {
    const mod = await import('@/services/methodologies/gentle');
    const out = runMethodology(mod.GENTLE_METHODOLOGY, [it_('x', 'tools', 5)], []);
    expect(out.find((s) => s.id.endsWith('::five-things'))).toBeDefined();
  });

  test('gentle methodology has no shaming language in any rule', async () => {
    const mod = await import('@/services/methodologies/gentle');
    const forbidden = ['應該', '必須', '錯誤'];
    for (const r of mod.GENTLE_METHODOLOGY.rules) {
      const text = r.suggestion.titleTemplate + r.suggestion.bodyTemplate;
      for (const word of forbidden) {
        expect(text).not.toContain(word);
      }
    }
  });

  test('photo-before-release rule fires for KonMari when sentimentals exist', async () => {
    const mod = await import('@/services/methodologies/konmari');
    const items = Array.from({ length: 5 }, (_, i) => it_(`s${i}`, 'sentimental', 1));
    const out = runMethodology(mod.KONMARI_METHODOLOGY, items, []);
    const rule = out.find((s) => s.id.endsWith('::photo-before-release'));
    expect(rule).toBeDefined();
    expect(rule?.body).toContain('Chu & Shu');
  });
});
