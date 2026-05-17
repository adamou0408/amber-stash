export type RuleCondition =
  | { type: 'categoryCount'; category: string; op: '>=' | '>' | '==' | '<' | '<='; value: number }
  | { type: 'hasSpaceKind'; kind: string }
  | { type: 'noSpaces' }
  | { type: 'noItems' }
  | { type: 'and'; conditions: RuleCondition[] }
  | { type: 'or'; conditions: RuleCondition[] }
  /**
   * 收納師原則 1/5/8：依使用頻率比對件數
   */
  | {
      type: 'frequencyCount';
      frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
      op: '>=' | '>' | '==' | '<' | '<=';
      value: number;
    }
  /**
   * 收納師原則 6（80% 留白原則）：任何空間的填充率超過 ratio
   */
  | { type: 'overcapacity'; ratio: number }
  /**
   * 收納師原則 5（黃金區）：某頻率物品不在黃金區的件數
   */
  | {
      type: 'zoneMismatch';
      frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
      op: '>=' | '>' | '==' | '<' | '<=';
      value: number;
    }
  /**
   * 收納師原則 1/5：尚未設定使用頻率的物品件數
   */
  | { type: 'unfrequented'; op: '>=' | '>'; value: number }
  /**
   * Home Edit 彩虹分類：某類別內有 N 種不同顏色（多元 → 彩虹排序有效）
   */
  | {
      type: 'colorDiversity';
      category: string;
      op: '>=' | '>' | '==' | '<' | '<=';
      value: number;
    }
  /**
   * Home Edit / KonMari：某顏色物品總件數
   */
  | {
      type: 'colorCount';
      color:
        | 'red'
        | 'orange'
        | 'yellow'
        | 'green'
        | 'blue'
        | 'purple'
        | 'pink'
        | 'black'
        | 'white'
        | 'brown'
        | 'gray'
        | 'multi';
      op: '>=' | '>' | '==' | '<' | '<=';
      value: number;
    }
  /**
   * 斷捨離七五一法則：某層級的實際比例 vs 目標比例
   * tier=show 目標 70%、stored 50%、shrine 1%
   * 條件成立：actual - target 與 op、value 比較
   */
  | {
      type: 'tierExceeds';
      tier: 'show' | 'stored' | 'shrine';
      /** 超出目標比例多少（0~1）— 例：op '>' value 0.1 表示超過目標 10 個百分點 */
      value: number;
      op: '>' | '>=';
    }
  /**
   * 斷捨離七五一法則：某層級尚未設定的物品件數
   */
  | { type: 'untieredCount'; op: '>=' | '>'; value: number };

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

/**
 * 方法論的「生命週期階段」 — 使用者整理流程的哪一段最適用本方法。
 *  - mindset:     建立心法、消費哲學（斷捨離）
 *  - deep-clean:  一次性大整理（KonMari）
 *  - maintenance: 日常維持（amberstash-default）
 *  - aesthetic:   視覺呈現 / 美觀升級（Home Edit）
 *
 * 使用者可依當前階段切換不同方法論，建議流程：
 *   mindset → deep-clean → maintenance → aesthetic（依個人 lifestyle）
 */
export type LifecyclePhase = 'mindset' | 'deep-clean' | 'maintenance' | 'aesthetic';

export const LIFECYCLE_LABEL: Record<LifecyclePhase, string> = {
  mindset: '心法',
  'deep-clean': '大整理',
  maintenance: '日常維持',
  aesthetic: '視覺呈現',
};

export const LIFECYCLE_EMOJI: Record<LifecyclePhase, string> = {
  mindset: '🧘',
  'deep-clean': '🌀',
  maintenance: '🔁',
  aesthetic: '🌈',
};

export const LIFECYCLE_DESC: Record<LifecyclePhase, string> = {
  mindset: '改變與物品的關係。先想清楚要什麼樣的生活，再決定留什麼。',
  'deep-clean': '一次性把所有東西過一遍 —「全部拿出來、按類別、心動才留」。',
  maintenance: '每天 5 分鐘維持。常用的放黃金區、80% 滿就減量、一進一出。',
  aesthetic: '完成基礎收納後追求視覺美感 — 彩虹分類、透明盒、看得見的秩序。',
};

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
  /** v4：方法論最適用的生命週期階段 */
  lifecyclePhase: LifecyclePhase;
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
  /** 各空間的填充率（itemCount / capacityEstimate） */
  spaceFillRatios: Record<string, number>;
  /** 某頻率物品不在黃金區的件數 */
  zoneMismatchCounts: Record<'daily' | 'weekly' | 'monthly' | 'rarely', number>;
  /** 尚未設定使用頻率的物品件數 */
  unfrequentedCount: number;
  /** 最擁擠的空間 */
  mostCrowdedSpaceName?: string;
  mostCrowdedSpaceRatio?: number;
  /** 每個顏色的件數 */
  colorCounts: Record<string, number>;
  /** 每個 category 內有多少種不同顏色（彩虹分類用） */
  categoryColorDiversity: Record<string, number>;
  /** 主導色（出現最多次的顏色） */
  dominantColor?: string;
  /** 七五一法則：每層的實際比例 */
  tierRatios: Record<'show' | 'stored' | 'shrine', number>;
  /** 七五一法則：每層的件數 */
  tierCounts: Record<'show' | 'stored' | 'shrine', number>;
  /** 尚未設定 visibility tier 的物品件數 */
  untieredCount: number;
};
