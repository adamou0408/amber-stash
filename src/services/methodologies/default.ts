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
    // === 收納師原則衍生規則（v4 加入）===
    {
      id: 'capacity-80-warning',
      description: '原則 6：留白與 80% 原則 — 超過 80% 滿就會塞不下、容易亂回去',
      appliesWhen: { type: 'overcapacity', ratio: 0.8 },
      priority: 95,
      suggestion: {
        titleTemplate: '⚠️ {crowdedSpace} 已 {crowdedRatio} 滿',
        bodyTemplate:
          '收納師的「80% 原則」：超過八成滿就該開始減量，不然新東西進來就會亂。建議從 rarely 標籤的物品先淘汰一輪，留 20% 給未來的東西。',
        tags: ['principle-6', 'capacity'],
      },
    },
    {
      id: 'zone-mismatch-daily',
      description: '原則 5：黃金區法則 — 每天用的應該放黃金區（腰到眼睛）',
      appliesWhen: { type: 'zoneMismatch', frequency: 'daily', op: '>=', value: 3 },
      priority: 92,
      suggestion: {
        titleTemplate: '🔥 {dailyMismatch} 件每天用的物品不在黃金區',
        bodyTemplate:
          '把每天會用的物品移到「腰到眼睛」高度，省下每天的反覆彎腰／墊腳。可以跟黃金區裡很少用的東西（rarely 標籤）對調 — 高頻物品搶黃金區是省力最大杠桿。',
        tags: ['principle-5', 'golden-zone'],
      },
    },
    {
      id: 'daily-zone-good',
      description: '原則 5 正向回饋：daily 物品全在黃金區',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'frequencyCount', frequency: 'daily', op: '>=', value: 3 },
          { type: 'zoneMismatch', frequency: 'daily', op: '==', value: 0 },
        ],
      },
      priority: 20,
      suggestion: {
        titleTemplate: '✓ 高頻物品收納合理',
        bodyTemplate:
          '你有 {daily} 件每天用的物品，全部都在黃金區。這是收納師講「省力最大杠桿」的狀態 — 維持下去。',
        tags: ['principle-5', 'positive'],
      },
    },
    {
      id: 'unfrequented-many',
      description: '原則 1/5：超過 5 件物品沒設使用頻率，引導補填以啟用其他規則',
      appliesWhen: { type: 'unfrequented', op: '>=', value: 5 },
      priority: 60,
      suggestion: {
        titleTemplate: '有 {unfrequented} 件物品還沒設使用頻率',
        bodyTemplate:
          '收納師問的第一題：「你過去一年用過嗎？」幫每件物品標個頻率（每天 / 每週 / 每月 / 很少），app 才能告訴你哪些該放黃金區、哪些該淘汰。長按物品列表的物品可以快速設定。',
        tags: ['principle-1', 'principle-5', 'onboarding'],
      },
    },
    {
      id: 'rarely-many',
      description: '原則 3：篩選 — rarely 物品多代表該重新評估保留',
      appliesWhen: { type: 'frequencyCount', frequency: 'rarely', op: '>=', value: 8 },
      priority: 65,
      suggestion: {
        titleTemplate: '❄️ {rarely} 件很少用的物品',
        bodyTemplate:
          '對每件 rarely 物品問五題：① 過去一年用過嗎？② 現在的你還需要嗎？③ 壞了/過期了嗎？④ 拿起來有開心的感覺嗎？⑤ 現在去店裡會買它嗎？答案多數是「不」就是淘汰候選。',
        tags: ['principle-3', 'declutter'],
      },
    },
  ],
  shoppingRules: [
    {
      id: 'clothing-divider',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 10 },
      pick: {
        nameTemplate: 'IKEA SKUBB 抽屜分隔 6 格',
        reasonTemplate: '衣物 {clothing} 件，分隔後直立摺好取拿更直覺',
        brand: 'IKEA',
        sku: 'SKUBB',
        priceTwdMin: 599,
        priceTwdMax: 599,
      },
    },
    {
      id: 'kitchen-jars',
      appliesWhen: { type: 'categoryCount', category: 'kitchen', op: '>=', value: 5 },
      pick: {
        nameTemplate: 'MUJI 聚丙烯密封保鮮盒（4 件組）',
        reasonTemplate: '乾貨統一收納並貼標籤；模組化可堆疊',
        brand: 'MUJI',
        priceTwdMin: 350,
        priceTwdMax: 800,
      },
    },
    {
      id: 'book-stand',
      appliesWhen: { type: 'categoryCount', category: 'books', op: '>=', value: 10 },
      pick: {
        nameTemplate: 'IKEA STAJLIG 金屬書檔（2 入）',
        reasonTemplate: '避免書本傾倒、便於分區',
        brand: 'IKEA',
        priceTwdMin: 199,
        priceTwdMax: 399,
      },
    },
    {
      id: 'cable-tie',
      appliesWhen: { type: 'categoryCount', category: 'electronics', op: '>=', value: 3 },
      pick: {
        nameTemplate: '魔鬼氈束線帶 + 標籤（×20）',
        reasonTemplate: '整理線材、避免打結；蝦皮或文具店均可',
        priceTwdMin: 100,
        priceTwdMax: 300,
      },
    },
    {
      id: 'toy-bin',
      appliesWhen: { type: 'categoryCount', category: 'toys', op: '>=', value: 8 },
      pick: {
        nameTemplate: 'IRIS OHYAMA 透明翻蓋收納箱',
        reasonTemplate: '玩具輪替制收納；透明面板看得見內容物',
        brand: 'IRIS OHYAMA',
        priceTwdMin: 350,
        priceTwdMax: 900,
      },
    },
    {
      id: 'wardrobe-shelf',
      appliesWhen: { type: 'hasSpaceKind', kind: 'wardrobe' },
      pick: {
        nameTemplate: 'NITORI 伸縮收納層板',
        reasonTemplate: '衣櫃上方常見死角可加層板',
        brand: 'NITORI',
        priceTwdMin: 299,
        priceTwdMax: 799,
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
  lifecyclePhase: 'maintenance',
};
