import type { DecisionContext, Methodology, RuleCondition } from '@/types/methodology';
import type { Item, Space, Suggestion, UseFrequency } from '@/types';

const FREQUENCIES: UseFrequency[] = ['daily', 'weekly', 'monthly', 'rarely'];

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
  let unfrequentedCount = 0;
  const itemCountBySpace: Record<string, number> = {};

  for (const it of items) {
    categoryCounts[it.category] = (categoryCounts[it.category] ?? 0) + it.quantity;
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
  }
}

function fillTemplate(tmpl: string, ctx: DecisionContext): string {
  return tmpl.replace(/\{(\w+)\}/g, (_, key) => {
    if (key === 'total') {
      return String(Object.values(ctx.categoryCounts).reduce((a, b) => a + b, 0));
    }
    if (key === 'daily' && key in ctx.frequencyCounts) {
      return String(ctx.frequencyCounts.daily);
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
