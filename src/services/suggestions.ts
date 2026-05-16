import type { Item, Space, Suggestion } from '@/types';
import { DEFAULT_METHODOLOGY } from './methodologies/default';
import { getMethodology } from './methodologies';
import { runMethodology, runShoppingPicks } from './methodologyEngine';

export function generateSuggestions(
  items: Item[],
  spaces: Space[],
  methodologyId?: string,
): Suggestion[] {
  const methodology = (methodologyId && getMethodology(methodologyId)) || DEFAULT_METHODOLOGY;
  return runMethodology(methodology, items, spaces);
}

export function generateShoppingPicks(
  items: Item[],
  spaces: Space[],
  methodologyId?: string,
): { name: string; reason: string }[] {
  const methodology = (methodologyId && getMethodology(methodologyId)) || DEFAULT_METHODOLOGY;
  return runShoppingPicks(methodology, items, spaces);
}
