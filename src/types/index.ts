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

export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  photoUri?: string;
  spaceId?: string;
  note?: string;
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
