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
