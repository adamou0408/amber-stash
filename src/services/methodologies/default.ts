import type { Methodology } from '@/types/methodology';

export const DEFAULT_METHODOLOGY: Methodology = {
  id: 'amberstash-default',
  authorId: 'amberstash-system',
  name: 'Amber Stash 通用收納',
  description: '系統內建的通用收納規則，從 inventory 結構推出最大公約數建議。',
  language: 'zh-TW',
  systemPrompt:
    '你是一位實用導向的收納顧問。依物品的類別、數量、所在空間，給出簡潔可執行的建議。每條建議在 80 字內，先講做法、再講原因。避免空泛的「保持整潔」這類話。',
  rules: [
    {
      id: 'clothing-many',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 10 },
      priority: 90,
      suggestion: {
        titleTemplate: '衣物 · {clothing} 件',
        bodyTemplate:
          '衣物有 {clothing} 件，建議以「直立摺疊 + 分類顏色」收進抽屜，方便一眼看清。可加抽屜分隔板，避免疊放後翻找凌亂。',
      },
    },
    {
      id: 'clothing-few',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '<', value: 10 },
      priority: 30,
      suggestion: {
        titleTemplate: '衣物 · {clothing} 件',
        bodyTemplate:
          '衣物不多，可按用途（外出 / 居家 / 季節）掛在衣櫃同一區，下方留出鞋盒空間。',
      },
    },
    {
      id: 'kitchen',
      appliesWhen: { type: 'categoryCount', category: 'kitchen', op: '>=', value: 1 },
      priority: 80,
      suggestion: {
        titleTemplate: '廚房 · {kitchen} 件',
        bodyTemplate:
          '廚房用品 {kitchen} 件：常用 8 成放「黃金高度」櫃內（腰至胸），備用品收上層或抽屜後段。乾貨建議統一密封罐，標籤朝外。',
      },
    },
    {
      id: 'books-many',
      appliesWhen: { type: 'categoryCount', category: 'books', op: '>=', value: 20 },
      priority: 70,
      suggestion: {
        titleTemplate: '書籍 · {books} 件',
        bodyTemplate:
          '{books} 本書建議分「在讀 / 待讀 / 已讀」三區，垂直立放避免疊放。可考慮捐出已讀的非工具書釋出空間。',
      },
    },
    {
      id: 'books-few',
      appliesWhen: { type: 'categoryCount', category: 'books', op: '<', value: 20 },
      priority: 25,
      suggestion: {
        titleTemplate: '書籍 · {books} 件',
        bodyTemplate: '書量不多，可橫向交錯立放於書桌層架，搭配書檔即可。',
      },
    },
    {
      id: 'electronics',
      appliesWhen: { type: 'categoryCount', category: 'electronics', op: '>=', value: 1 },
      priority: 60,
      suggestion: {
        titleTemplate: '電子產品 · {electronics} 件',
        bodyTemplate:
          '電子產品的線材最容易亂：建議用魔鬼氈束線帶 + 標籤捲收，集中收一個盒子。充電器只留常用 1-2 個。',
      },
    },
    {
      id: 'documents',
      appliesWhen: { type: 'categoryCount', category: 'documents', op: '>=', value: 1 },
      priority: 55,
      suggestion: {
        titleTemplate: '文件 · {documents} 件',
        bodyTemplate:
          '文件分「必留（身分 / 保單 / 房契）/ 短期保存（一年內報稅）/ 廢棄」三層，必留掃描備份後縮減紙本。',
      },
    },
    {
      id: 'cosmetics',
      appliesWhen: { type: 'categoryCount', category: 'cosmetics', op: '>=', value: 1 },
      priority: 50,
      suggestion: {
        titleTemplate: '美妝 · {cosmetics} 件',
        bodyTemplate:
          '美妝保養請以「使用頻率」排序，常用放轉盤或前排，季節性收抽屜。檢查保存期限，過期清掉是最大效益。',
      },
    },
    {
      id: 'toys',
      appliesWhen: { type: 'categoryCount', category: 'toys', op: '>=', value: 1 },
      priority: 45,
      suggestion: {
        titleTemplate: '玩具 · {toys} 件',
        bodyTemplate:
          '玩具用「透明收納箱 + 圖卡標籤」讓孩子自己收。建議輪替收納：一半收起來，一個月換一次保持新鮮感。',
      },
    },
    {
      id: 'tools',
      appliesWhen: { type: 'categoryCount', category: 'tools', op: '>=', value: 1 },
      priority: 40,
      suggestion: {
        titleTemplate: '工具 · {tools} 件',
        bodyTemplate:
          '工具掛上洞洞板或磁吸條，能「站著看見」就不會重複買。耗材（螺絲、釘子）用透明小盒分類。',
      },
    },
    {
      id: 'sentimental',
      appliesWhen: { type: 'categoryCount', category: 'sentimental', op: '>=', value: 1 },
      priority: 35,
      suggestion: {
        titleTemplate: '紀念品 · {sentimental} 件',
        bodyTemplate:
          '紀念品請設「一個盒子原則」：滿了就要做取捨。重要的可拍照數位化保存。',
      },
    },
    {
      id: 'no-space',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'noSpaces' },
          { type: 'categoryCount', category: '*', op: '>', value: 0 },
        ],
      },
      priority: 100,
      suggestion: {
        titleTemplate: '先描述一下你的空間',
        bodyTemplate:
          '你已經建了物品清單，但還沒設定空間。建立衣櫃 / 抽屜 / 書桌等空間後，可以拿到更精準的分區建議。',
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: '從一個抽屜開始',
        bodyTemplate:
          '建議從最常用、最亂的一個抽屜或櫃子開始拍照建檔。完成第一個小區域，再擴張到整個房間。',
      },
    },
  ],
  shoppingRules: [
    {
      id: 'clothing-divider',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 10 },
      pick: {
        nameTemplate: '抽屜分隔收納盒（衣物用）',
        reasonTemplate: '衣物 {clothing} 件，分隔後直立摺好取拿更直覺',
      },
    },
    {
      id: 'kitchen-jars',
      appliesWhen: { type: 'categoryCount', category: 'kitchen', op: '>=', value: 5 },
      pick: {
        nameTemplate: '密封儲物罐 4 件組',
        reasonTemplate: '乾貨統一收納並貼標籤',
      },
    },
    {
      id: 'book-stand',
      appliesWhen: { type: 'categoryCount', category: 'books', op: '>=', value: 10 },
      pick: {
        nameTemplate: '金屬書檔 2 入',
        reasonTemplate: '避免書本傾倒、便於分區',
      },
    },
    {
      id: 'cable-tie',
      appliesWhen: { type: 'categoryCount', category: 'electronics', op: '>=', value: 3 },
      pick: {
        nameTemplate: '魔鬼氈束線帶 + 標籤',
        reasonTemplate: '整理線材、避免打結',
      },
    },
    {
      id: 'toy-bin',
      appliesWhen: { type: 'categoryCount', category: 'toys', op: '>=', value: 8 },
      pick: {
        nameTemplate: '透明翻蓋收納箱',
        reasonTemplate: '玩具輪替制收納',
      },
    },
    {
      id: 'wardrobe-shelf',
      appliesWhen: { type: 'hasSpaceKind', kind: 'wardrobe' },
      pick: {
        nameTemplate: '伸縮收納層板',
        reasonTemplate: '衣櫃上方常見死角可加層板',
      },
    },
  ],
  appliesTo: [
    'clothing',
    'kitchen',
    'books',
    'electronics',
    'documents',
    'cosmetics',
    'toys',
    'tools',
    'sentimental',
    'other',
  ],
  pricing: { kind: 'free' },
  version: 1,
};
