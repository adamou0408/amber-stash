import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/storage/keys';
import type { Item, ShoppingItem, Space } from '@/types';

export async function loadDemoData(): Promise<{
  spaces: Space[];
  items: Item[];
  shopping: ShoppingItem[];
}> {
  const now = Date.now();
  const wardrobeId = String(uuid.v4());
  const drawerId = String(uuid.v4());
  const deskId = String(uuid.v4());
  const shelfId = String(uuid.v4());
  const storageRoomId = String(uuid.v4());

  const spaces: Space[] = [
    {
      id: wardrobeId,
      name: '主臥衣櫃',
      kind: 'wardrobe',
      widthCm: 180,
      heightCm: 220,
      depthCm: 60,
      capacityEstimate: 25,
      createdAt: now,
    },
    {
      id: drawerId,
      name: '玄關抽屜',
      kind: 'drawer',
      widthCm: 60,
      heightCm: 20,
      depthCm: 45,
      capacityEstimate: 12,
      createdAt: now - 1000,
    },
    {
      id: deskId,
      name: '工作書桌',
      kind: 'desk',
      widthCm: 140,
      heightCm: 75,
      depthCm: 70,
      capacityEstimate: 20,
      createdAt: now - 2000,
    },
    {
      id: shelfId,
      name: '客廳層架',
      kind: 'shelf',
      widthCm: 80,
      heightCm: 180,
      depthCm: 30,
      capacityEstimate: 30,
      createdAt: now - 3000,
    },
    {
      id: storageRoomId,
      name: '陽台儲藏',
      kind: 'storage_room',
      widthCm: 120,
      heightCm: 220,
      depthCm: 80,
      capacityEstimate: 20,
      createdAt: now - 4000,
    },
  ];

  // demo 資料故意混合：有些設好 frequency + golden zone，有些沒設 — 用來展示規則差異
  const items: Item[] = [
    mk('冬季羽絨外套', 'clothing', 3, wardrobeId, now, 'monthly', false),
    mk('針織毛衣', 'clothing', 8, wardrobeId, now - 1000, 'weekly', true),
    mk('長袖襯衫', 'clothing', 12, wardrobeId, now - 2000, 'weekly', true),
    mk('行動電源', 'electronics', 2, drawerId, now - 3000, 'daily', true),
    mk('USB-C 線', 'electronics', 5, drawerId, now - 4000, 'daily', true),
    mk('家用鑰匙', 'tools', 3, drawerId, now - 5000, 'daily', true),
    mk('筆記型電腦', 'electronics', 1, deskId, now - 6000, 'daily', true),
    mk('A4 筆記本', 'books', 4, deskId, now - 7000, 'weekly'),
    mk('原子筆', 'books', 12, deskId, now - 8000, 'daily', false),
    mk('技術書籍', 'books', 18, shelfId, now - 9000, 'monthly'),
    mk('相框', 'sentimental', 6, shelfId, now - 10000, 'rarely'),
    mk('露營帳篷', 'tools', 1, storageRoomId, now - 11000, 'rarely'),
    mk('登山背包', 'tools', 2, storageRoomId, now - 12000, 'rarely'),
    mk('行李箱', 'tools', 3, storageRoomId, now - 13000, 'rarely'),
  ];

  const shopping: ShoppingItem[] = [
    {
      id: String(uuid.v4()),
      name: '抽屜分隔收納盒',
      reason: '衣物 23 件，分隔後直立摺好取拿更直覺',
      done: false,
      createdAt: now,
    },
    {
      id: String(uuid.v4()),
      name: '魔鬼氈束線帶 ×20',
      reason: '整理線材、避免打結',
      done: false,
      createdAt: now - 1000,
    },
    {
      id: String(uuid.v4()),
      name: '金屬書檔 2 入',
      reason: '避免書本傾倒、便於分區',
      done: true,
      createdAt: now - 2000,
    },
  ];

  await AsyncStorage.setMany({
    [STORAGE_KEYS.spaces]: JSON.stringify(spaces),
    [STORAGE_KEYS.items]: JSON.stringify(items),
    [STORAGE_KEYS.shopping]: JSON.stringify(shopping),
  });

  return { spaces, items, shopping };
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeMany([
    STORAGE_KEYS.spaces,
    STORAGE_KEYS.items,
    STORAGE_KEYS.shopping,
  ]);
}

function mk(
  name: string,
  category: Item['category'],
  quantity: number,
  spaceId: string,
  createdAt: number,
  useFrequency?: Item['useFrequency'],
  inGoldenZone?: boolean,
): Item {
  return {
    id: String(uuid.v4()),
    name,
    category,
    quantity,
    spaceId,
    useFrequency,
    inGoldenZone,
    createdAt,
    updatedAt: createdAt,
  };
}
