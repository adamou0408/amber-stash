export type ItemCategory =
  | 'clothing'
  | 'kitchen'
  | 'books'
  | 'electronics'
  | 'documents'
  | 'cosmetics'
  | 'toys'
  | 'tools'
  | 'sentimental'
  | 'other';

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  clothing: '衣物',
  kitchen: '廚房',
  books: '書籍文具',
  electronics: '電子產品',
  documents: '文件',
  cosmetics: '美妝保養',
  toys: '玩具',
  tools: '工具',
  sentimental: '紀念品',
  other: '其他',
};

export type SpaceKind = 'wardrobe' | 'drawer' | 'desk' | 'shelf' | 'storage_room' | 'other';

export const SPACE_LABEL: Record<SpaceKind, string> = {
  wardrobe: '衣櫃',
  drawer: '抽屜',
  desk: '書桌',
  shelf: '層架',
  storage_room: '儲藏室',
  other: '其他',
};

export const SPACE_EMOJI: Record<SpaceKind, string> = {
  wardrobe: '👔',
  drawer: '🗄️',
  desk: '📚',
  shelf: '🪑',
  storage_room: '📦',
  other: '🏷️',
};

/**
 * 使用頻率 — 收納師原則 1/5/8 的共用底層欄位。
 *  - daily: 每天用（鑰匙、常穿外套）
 *  - weekly: 每週用幾次（運動服、特定鍋具）
 *  - monthly: 每月用一兩次（季節衣物、不常用文件）
 *  - rarely: 很少用（一年內幾乎沒拿過）
 */
export type UseFrequency = 'daily' | 'weekly' | 'monthly' | 'rarely';

export const FREQUENCY_LABEL: Record<UseFrequency, string> = {
  daily: '每天',
  weekly: '每週',
  monthly: '每月',
  rarely: '很少',
};

export const FREQUENCY_EMOJI: Record<UseFrequency, string> = {
  daily: '🔥',
  weekly: '⭐',
  monthly: '🌙',
  rarely: '❄️',
};

/**
 * 顏色 — Home Edit 彩虹分類 + KonMari 同色系收納的底層欄位。
 * 採 ROYGBIV + 中性色，足以覆蓋日常物件視覺分類。
 */
export type ItemColor =
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

export const COLOR_LABEL: Record<ItemColor, string> = {
  red: '紅',
  orange: '橘',
  yellow: '黃',
  green: '綠',
  blue: '藍',
  purple: '紫',
  pink: '粉',
  black: '黑',
  white: '白',
  brown: '棕',
  gray: '灰',
  multi: '混色',
};

export const COLOR_HEX: Record<ItemColor, string> = {
  red: '#e74c3c',
  orange: '#e67e22',
  yellow: '#f1c40f',
  green: '#27ae60',
  blue: '#3498db',
  purple: '#9b59b6',
  pink: '#fd79a8',
  black: '#2c3e50',
  white: '#ecf0f1',
  brown: '#a0522d',
  gray: '#95a5a6',
  multi: 'linear', // 給 UI 用
};

/** ROYGBIV 排序順序（Home Edit 彩虹分類用）— 中性色排在彩虹之後 */
export const COLOR_ORDER: Record<ItemColor, number> = {
  red: 0, orange: 1, yellow: 2, green: 3, blue: 4, purple: 5, pink: 6,
  white: 7, gray: 8, brown: 9, black: 10, multi: 11,
};

/**
 * 可見性分層 — 山下英子《斷捨離》的「七五一法則」底層欄位。
 *  - show:    展示出來、看得見的（目標：滿格 70%）
 *  - stored:  收起來、有門遮起來的（目標：滿格 50%）
 *  - shrine:  紀念區、珍藏（目標：1% — 只能極少數）
 */
export type VisibilityTier = 'show' | 'stored' | 'shrine';

export const TIER_LABEL: Record<VisibilityTier, string> = {
  show: '看得見',
  stored: '收起來',
  shrine: '紀念區',
};

export const TIER_EMOJI: Record<VisibilityTier, string> = {
  show: '👁️',
  stored: '📦',
  shrine: '🏛️',
};

/** 七五一法則目標比例 */
export const TIER_TARGET_RATIO: Record<VisibilityTier, number> = {
  show: 0.7,
  stored: 0.5,
  shrine: 0.01,
};

/**
 * 收納擺放方式 — KonMari 直立折疊 / 工具站立法的底層欄位。
 *  - vertical:  直立摺疊（衣物像書本立起）
 *  - flat:      平放疊放
 *  - hanging:   吊掛
 *  - standing:  站立（工具、瓶罐）
 *  - rolled:    捲起（運動服、毛巾）
 */
export type PlacementHint = 'vertical' | 'flat' | 'hanging' | 'standing' | 'rolled';

export const PLACEMENT_LABEL: Record<PlacementHint, string> = {
  vertical: '直立摺疊',
  flat: '平放疊放',
  hanging: '吊掛',
  standing: '站立',
  rolled: '捲起',
};

export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  photoUri?: string;
  spaceId?: string;
  note?: string;
  /** 收納師原則 1/5/8：使用頻率。未填代表使用者還沒分類過。 */
  useFrequency?: UseFrequency;
  /**
   * 收納師原則 5：是否放在「黃金區」（腰至眼睛高度，最易取的位置）。
   * 與 useFrequency 配合判斷取物效率：daily + !inGoldenZone = 警示。
   */
  inGoldenZone?: boolean;
  /** Home Edit 彩虹分類 / KonMari 同色系收納 */
  color?: ItemColor;
  /** 斷捨離七五一法則：show / stored / shrine */
  visibilityTier?: VisibilityTier;
  /** KonMari 直立折疊、Home Edit 站立展示 */
  placement?: PlacementHint;
  /**
   * 廖心筠聯想性收納法：本物品收納時，要「跟誰一起」放？
   * 例：鑰匙 → "口罩、悠遊卡"（出門連動），保養品 → "化妝棉、卸妝水"（使用順序）。
   * 自由文字，不限格式。空值代表使用者尚未做聯想設計。
   */
  associationHint?: string;
  /**
   * 是否為「家族傳承物 / 紀念性遺物」— 華人收納文化特殊欄位。
   * 觸發更溫和的處置建議，避免使用「丟」「淘汰」字眼。
   */
  isHeirloom?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Space = {
  id: string;
  name: string;
  kind: SpaceKind;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  /**
   * 收納師原則 6（80% 留白原則）：使用者粗估能舒適容納多少件物品。
   * 超過 80% 觸發警示。未填代表此空間不參與容量檢查。
   */
  capacityEstimate?: number;
  /**
   * 空間限制條件 — 影響可推薦的收納手法：
   *  - 'rental':  租屋（不能釘牆、需用 3M 無痕 / 伸縮桿）
   *  - 'micro':   小坪數（需垂直空間 / 多功能家具）
   *  - 'elder':   銀髮使用者（取物高度 = 肚臍至肩，不是腰至眼）
   *  - 'kids':    兒童共用（高度低、防傾倒）
   */
  constraints?: ('rental' | 'micro' | 'elder' | 'kids')[];
  note?: string;
  createdAt: number;
};

export type ShoppingItem = {
  id: string;
  name: string;
  reason?: string;
  done: boolean;
  createdAt: number;
};

export type Suggestion = {
  id: string;
  title: string;
  body: string;
  forSpaceId?: string;
};
