import type { DecisionContext, Methodology, RuleCondition } from '@/types/methodology';
import type {
  Item,
  ItemColor,
  Space,
  Suggestion,
  UseFrequency,
  VisibilityTier,
} from '@/types';
import { COLOR_LABEL, TIER_TARGET_RATIO } from '@/types';

const FREQUENCIES: UseFrequency[] = ['daily', 'weekly', 'monthly', 'rarely'];
const TIERS: VisibilityTier[] = ['show', 'stored', 'shrine'];

export function buildContext(items: Item[], spaces: Space[]): DecisionContext {
  const categoryCounts: Record<string, number> = {};
  const frequencyCounts: Record<UseFrequency, number> = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    rarely: 0,
  };
  const zoneMismatchCounts: Record<UseFrequency, number> = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    rarely: 0,
  };
  const colorCounts: Record<string, number> = {};
  const categoryColorsSet: Record<string, Set<string>> = {};
  const tierCounts: Record<VisibilityTier, number> = {
    show: 0,
    stored: 0,
    shrine: 0,
  };
  let unfrequentedCount = 0;
  let untieredCount = 0;
  let unassociatedCount = 0;
  let heirloomCount = 0;
  let totalQty = 0;
  const itemCountBySpace: Record<string, number> = {};

  for (const it of items) {
    categoryCounts[it.category] = (categoryCounts[it.category] ?? 0) + it.quantity;
    totalQty += it.quantity;
    if (it.useFrequency) {
      frequencyCounts[it.useFrequency] += it.quantity;
      if (!it.inGoldenZone) {
        zoneMismatchCounts[it.useFrequency] += it.quantity;
      }
    } else {
      unfrequentedCount += it.quantity;
    }
    if (it.spaceId) {
      itemCountBySpace[it.spaceId] = (itemCountBySpace[it.spaceId] ?? 0) + it.quantity;
    }
    if (it.color) {
      colorCounts[it.color] = (colorCounts[it.color] ?? 0) + it.quantity;
      if (!categoryColorsSet[it.category]) categoryColorsSet[it.category] = new Set();
      categoryColorsSet[it.category].add(it.color);
    }
    if (it.visibilityTier) {
      tierCounts[it.visibilityTier] += it.quantity;
    } else {
      untieredCount += it.quantity;
    }
    if (!it.associationHint) {
      unassociatedCount += it.quantity;
    }
    if (it.isHeirloom) {
      heirloomCount += it.quantity;
    }
  }

  const categoryColorDiversity: Record<string, number> = {};
  for (const cat of Object.keys(categoryColorsSet)) {
    categoryColorDiversity[cat] = categoryColorsSet[cat].size;
  }

  // 主導色 = 件數最多的顏色
  let dominantColor: string | undefined;
  let dominantCount = 0;
  for (const [color, count] of Object.entries(colorCounts)) {
    if (count > dominantCount) {
      dominantCount = count;
      dominantColor = color;
    }
  }

  // 七五一法則：實際比例 = 該層件數 / 總件數
  const tierRatios: Record<VisibilityTier, number> = { show: 0, stored: 0, shrine: 0 };
  if (totalQty > 0) {
    for (const t of TIERS) {
      tierRatios[t] = tierCounts[t] / totalQty;
    }
  }

  const spaceFillRatios: Record<string, number> = {};
  let mostCrowdedSpaceName: string | undefined;
  let mostCrowdedSpaceRatio: number | undefined;
  for (const sp of spaces) {
    if (sp.capacityEstimate && sp.capacityEstimate > 0) {
      const count = itemCountBySpace[sp.id] ?? 0;
      const ratio = count / sp.capacityEstimate;
      spaceFillRatios[sp.id] = ratio;
      if (mostCrowdedSpaceRatio === undefined || ratio > mostCrowdedSpaceRatio) {
        mostCrowdedSpaceRatio = ratio;
        mostCrowdedSpaceName = sp.name;
      }
    }
  }

  return {
    itemCount: items.length,
    spaceCount: spaces.length,
    categoryCounts,
    spaceKinds: new Set(spaces.map((s) => s.kind)),
    frequencyCounts,
    spaceFillRatios,
    zoneMismatchCounts,
    unfrequentedCount,
    mostCrowdedSpaceName,
    mostCrowdedSpaceRatio,
    colorCounts,
    categoryColorDiversity,
    dominantColor,
    tierRatios,
    tierCounts,
    untieredCount,
    unassociatedCount,
    heirloomCount,
  };
}

function compare(value: number, op: '>=' | '>' | '==' | '<' | '<=', target: number): boolean {
  switch (op) {
    case '>=': return value >= target;
    case '>': return value > target;
    case '==': return value === target;
    case '<': return value < target;
    case '<=': return value <= target;
  }
}

export function evaluate(cond: RuleCondition, ctx: DecisionContext): boolean {
  switch (cond.type) {
    case 'categoryCount': {
      const value =
        cond.category === '*'
          ? Object.values(ctx.categoryCounts).reduce((a, b) => a + b, 0)
          : ctx.categoryCounts[cond.category] ?? 0;
      return compare(value, cond.op, cond.value);
    }
    case 'hasSpaceKind':
      return ctx.spaceKinds.has(cond.kind);
    case 'noSpaces':
      return ctx.spaceCount === 0;
    case 'noItems':
      return ctx.itemCount === 0;
    case 'and':
      return cond.conditions.every((c) => evaluate(c, ctx));
    case 'or':
      return cond.conditions.some((c) => evaluate(c, ctx));
    case 'frequencyCount':
      return compare(ctx.frequencyCounts[cond.frequency], cond.op, cond.value);
    case 'overcapacity':
      return Object.values(ctx.spaceFillRatios).some((r) => r > cond.ratio);
    case 'zoneMismatch':
      return compare(ctx.zoneMismatchCounts[cond.frequency], cond.op, cond.value);
    case 'unfrequented':
      return compare(ctx.unfrequentedCount, cond.op, cond.value);
    case 'colorDiversity':
      return compare(ctx.categoryColorDiversity[cond.category] ?? 0, cond.op, cond.value);
    case 'colorCount':
      return compare(ctx.colorCounts[cond.color] ?? 0, cond.op, cond.value);
    case 'tierExceeds': {
      const actual = ctx.tierRatios[cond.tier];
      const target = TIER_TARGET_RATIO[cond.tier];
      const excess = actual - target;
      return cond.op === '>' ? excess > cond.value : excess >= cond.value;
    }
    case 'untieredCount':
      return compare(ctx.untieredCount, cond.op, cond.value);
    case 'unassociatedCount':
      return compare(ctx.unassociatedCount, cond.op, cond.value);
    case 'heirloomCount':
      return compare(ctx.heirloomCount, cond.op, cond.value);
  }
}

function fillTemplate(tmpl: string, ctx: DecisionContext): string {
  return tmpl.replace(/\{(\w+)\}/g, (_, key) => {
    if (key === 'total') {
      return String(Object.values(ctx.categoryCounts).reduce((a, b) => a + b, 0));
    }
    if (FREQUENCIES.includes(key as UseFrequency)) {
      return String(ctx.frequencyCounts[key as UseFrequency]);
    }
    if (key === 'unfrequented') return String(ctx.unfrequentedCount);
    if (key === 'crowdedSpace') return ctx.mostCrowdedSpaceName ?? '某個空間';
    if (key === 'crowdedRatio') {
      return ctx.mostCrowdedSpaceRatio !== undefined
        ? `${Math.round(ctx.mostCrowdedSpaceRatio * 100)}%`
        : '?%';
    }
    if (key === 'dailyMismatch') return String(ctx.zoneMismatchCounts.daily);
    if (key === 'dominantColor') {
      return ctx.dominantColor ? COLOR_LABEL[ctx.dominantColor as ItemColor] ?? ctx.dominantColor : '';
    }
    if (key === 'colorVarieties') return String(Object.keys(ctx.colorCounts).length);
    if (TIERS.includes(key as VisibilityTier)) {
      return String(ctx.tierCounts[key as VisibilityTier]);
    }
    if (key === 'showRatio') return `${Math.round(ctx.tierRatios.show * 100)}%`;
    if (key === 'storedRatio') return `${Math.round(ctx.tierRatios.stored * 100)}%`;
    if (key === 'shrineRatio') return `${Math.round(ctx.tierRatios.shrine * 100)}%`;
    if (key === 'untiered') return String(ctx.untieredCount);
    if (key === 'unassociated') return String(ctx.unassociatedCount);
    if (key === 'heirloom') return String(ctx.heirloomCount);
    return String(ctx.categoryCounts[key] ?? 0);
  });
}

export function runMethodology(
  methodology: Methodology,
  items: Item[],
  spaces: Space[],
): Suggestion[] {
  const ctx = buildContext(items, spaces);
  const matched = methodology.rules
    .filter((r) => evaluate(r.appliesWhen, ctx))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  return matched.map((r) => ({
    id: `${methodology.id}::${r.id}`,
    title: fillTemplate(r.suggestion.titleTemplate, ctx),
    body: fillTemplate(r.suggestion.bodyTemplate, ctx),
  }));
}

export function runShoppingPicks(
  methodology: Methodology,
  items: Item[],
  spaces: Space[],
): { name: string; reason: string }[] {
  const ctx = buildContext(items, spaces);
  return methodology.shoppingRules
    .filter((r) => evaluate(r.appliesWhen, ctx))
    .map((r) => ({
      name: fillTemplate(r.pick.nameTemplate, ctx),
      reason: fillTemplate(r.pick.reasonTemplate, ctx),
    }));
}
