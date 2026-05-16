import type { DecisionContext, Methodology, RuleCondition } from '@/types/methodology';
import type { Item, Space, Suggestion } from '@/types';

export function buildContext(items: Item[], spaces: Space[]): DecisionContext {
  const categoryCounts: Record<string, number> = {};
  for (const it of items) {
    categoryCounts[it.category] = (categoryCounts[it.category] ?? 0) + it.quantity;
  }
  return {
    itemCount: items.length,
    spaceCount: spaces.length,
    categoryCounts,
    spaceKinds: new Set(spaces.map((s) => s.kind)),
  };
}

export function evaluate(cond: RuleCondition, ctx: DecisionContext): boolean {
  switch (cond.type) {
    case 'categoryCount': {
      const value =
        cond.category === '*'
          ? Object.values(ctx.categoryCounts).reduce((a, b) => a + b, 0)
          : ctx.categoryCounts[cond.category] ?? 0;
      switch (cond.op) {
        case '>=': return value >= cond.value;
        case '>': return value > cond.value;
        case '==': return value === cond.value;
        case '<': return value < cond.value;
        case '<=': return value <= cond.value;
      }
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
  }
}

function fillTemplate(tmpl: string, ctx: DecisionContext): string {
  return tmpl.replace(/\{(\w+)\}/g, (_, key) => {
    if (key === 'total') {
      return String(Object.values(ctx.categoryCounts).reduce((a, b) => a + b, 0));
    }
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
