export type RuleCondition =
  | { type: 'categoryCount'; category: string; op: '>=' | '>' | '==' | '<' | '<='; value: number }
  | { type: 'hasSpaceKind'; kind: string }
  | { type: 'noSpaces' }
  | { type: 'noItems' }
  | { type: 'and'; conditions: RuleCondition[] }
  | { type: 'or'; conditions: RuleCondition[] };

export type RuleSuggestion = {
  titleTemplate: string;
  bodyTemplate: string;
  tags?: string[];
};

export type DecisionRule = {
  id: string;
  description?: string;
  appliesWhen: RuleCondition;
  suggestion: RuleSuggestion;
  priority?: number;
};

export type ShoppingRule = {
  id: string;
  appliesWhen: RuleCondition;
  pick: {
    nameTemplate: string;
    reasonTemplate: string;
  };
};

export type MethodologyPricing =
  | { kind: 'free' }
  | { kind: 'subscription'; monthlyTwd: number }
  | { kind: 'oneTime'; priceTwd: number };

export type Methodology = {
  id: string;
  authorId: string;
  name: string;
  description: string;
  language: 'zh-TW' | 'ja' | 'en';
  systemPrompt: string;
  rules: DecisionRule[];
  shoppingRules: ShoppingRule[];
  appliesTo: string[];
  pricing: MethodologyPricing;
  version: number;
};

export type Expert = {
  id: string;
  displayName: string;
  bio: string;
  avatarUri?: string;
  certifiedAt?: number;
  methodologyIds: string[];
};

export type DecisionContext = {
  itemCount: number;
  spaceCount: number;
  categoryCounts: Record<string, number>;
  spaceKinds: Set<string>;
};
