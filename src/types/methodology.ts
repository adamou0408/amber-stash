export type RuleCondition =
  | { type: 'categoryCount'; category: string; op: '>=' | '>' | '==' | '<' | '<='; value: number }
  | { type: 'hasSpaceKind'; kind: string }
  | { type: 'noSpaces' }
  | { type: 'noItems' }
  | { type: 'and'; conditions: RuleCondition[] }
  | { type: 'or'; conditions: RuleCondition[] }
  /**
   * 收納師原則 1/5/8：依使用頻率比對件數
   * 例：daily 件數 >= 5 → 高頻物品多
   */
  | {
      type: 'frequencyCount';
      frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
      op: '>=' | '>' | '==' | '<' | '<=';
      value: number;
    }
  /**
   * 收納師原則 6（80% 留白原則）：任何空間的填充率超過 ratio
   * ratio 為 0~1 的浮點數。需要 Space.capacityEstimate 才會生效。
   */
  | { type: 'overcapacity'; ratio: number }
  /**
   * 收納師原則 5（黃金區）：高頻物品但不在黃金區的件數 >= value
   * 例：daily 物品 5 件不在黃金區 → 建議重新分區
   */
  | {
      type: 'zoneMismatch';
      frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
      op: '>=' | '>' | '==' | '<' | '<=';
      value: number;
    }
  /**
   * 收納師原則 1/5：尚未設定使用頻率的物品件數 >= value
   * 引導使用者補填，這欄填了之後其他規則才能發揮
   */
  | { type: 'unfrequented'; op: '>=' | '>'; value: number };

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
  /** 各頻率的物品總件數（用 quantity 加總） */
  frequencyCounts: Record<'daily' | 'weekly' | 'monthly' | 'rarely', number>;
  /** 各空間的填充率（itemCount / capacityEstimate）；無容量設定不入此 map */
  spaceFillRatios: Record<string, number>;
  /** 高頻物品（daily / weekly）但不在黃金區的件數 */
  zoneMismatchCounts: Record<'daily' | 'weekly' | 'monthly' | 'rarely', number>;
  /** 尚未設定使用頻率的物品件數 */
  unfrequentedCount: number;
  /** 最擁擠的空間名稱（fillRatio 最高） — 用於模板填詞 */
  mostCrowdedSpaceName?: string;
  mostCrowdedSpaceRatio?: number;
};
