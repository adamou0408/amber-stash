import type { Methodology } from '@/types/methodology';

/**
 * The Home Edit（near-port of Clea Shearer & Joanna Teplin 方法）
 * 內建示範方法論 — v4 階段不對外授權。
 * 生命週期定位：aesthetic — 完成基礎收納後追求視覺秩序。
 *
 * 核心：美觀與功能並重，秩序帶來平靜
 * 招牌技巧：彩虹分類（ROYGBIV）+ 透明收納盒 + 標籤
 */
export const HOME_EDIT_METHODOLOGY: Methodology = {
  id: 'home-edit-zh',
  authorId: 'placeholder-home-edit',
  name: 'The Home Edit',
  description:
    '美觀與功能並重 — 彩虹分類、透明收納盒、看得見的秩序。適合已完成基礎減量、想再升級視覺感的家。',
  language: 'zh-TW',
  systemPrompt:
    '你是 The Home Edit 風格的收納顧問。語氣明亮自信，重視「視覺秩序帶來心理平靜」。建議都以彩虹分類（ROYGBIV）、同高度排列、透明收納盒、標籤化為核心。前提：使用者已完成基礎減量。',
  lifecyclePhase: 'aesthetic',
  rules: [
    {
      id: 'rainbow-clothing',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'categoryCount', category: 'clothing', op: '>=', value: 15 },
          { type: 'colorDiversity', category: 'clothing', op: '>=', value: 4 },
        ],
      },
      priority: 95,
      suggestion: {
        titleTemplate: '🌈 衣物彩虹分類 · {colorVarieties} 種顏色',
        bodyTemplate:
          '依 ROYGBIV 順序排列：紅 → 橙 → 黃 → 綠 → 藍 → 紫 → 粉 → 白 → 灰 → 棕 → 黑。掛衣服或摺衣抽屜都用此順序。視覺立刻整齊、心情平靜，搭配也更直覺。',
        tags: ['home-edit', 'rainbow'],
      },
    },
    {
      id: 'rainbow-books',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'categoryCount', category: 'books', op: '>=', value: 20 },
          { type: 'colorDiversity', category: 'books', op: '>=', value: 5 },
        ],
      },
      priority: 75,
      suggestion: {
        titleTemplate: '🌈 書脊彩虹排列 · {books} 本',
        bodyTemplate:
          '依書脊顏色排成彩虹漸層 — 這是 The Home Edit 招牌畫面。書況 IG 級美觀，找書憑視覺記憶反而更快（你會記得「藍色那本」）。實用 + 美觀兼得。',
        tags: ['home-edit', 'rainbow'],
      },
    },
    {
      id: 'clear-bins-toys',
      appliesWhen: { type: 'categoryCount', category: 'toys', op: '>=', value: 10 },
      priority: 85,
      suggestion: {
        titleTemplate: '🪞 玩具 · {toys} 件 → 透明盒 + 標籤',
        bodyTemplate:
          '玩具全部裝進透明翻蓋收納盒，盒外貼大字標籤（孩子認字前用圖卡）。看得見內容物 = 不會忘記擁有 = 不會重複買。也訓練孩子物歸原位。',
        tags: ['home-edit', 'clear-bin', 'labels'],
      },
    },
    {
      id: 'clear-bins-cosmetics',
      appliesWhen: { type: 'categoryCount', category: 'cosmetics', op: '>=', value: 8 },
      priority: 70,
      suggestion: {
        titleTemplate: '💄 美妝 · {cosmetics} 件 → 壓克力轉盤 + 分隔',
        bodyTemplate:
          '美妝用壓克力收納盤（最好可旋轉），依使用頻率 → 顏色雙層排序。第一層「每天用」第二層「換場合用」。每件都看得見、不再翻找。',
        tags: ['home-edit', 'aesthetic'],
      },
    },
    {
      id: 'kitchen-pour',
      appliesWhen: { type: 'categoryCount', category: 'kitchen', op: '>=', value: 8 },
      priority: 80,
      suggestion: {
        titleTemplate: '🫙 廚房乾貨 → 統一儲物罐',
        bodyTemplate:
          '把麵粉、米、糖、咖啡豆等乾貨倒進**同一系列**透明儲物罐（同形狀、同材質、同標籤字體）。封口固定 + 標籤朝外。視覺一致 = 廚房檔次立刻升級，找食材也比看包裝快 3 倍。',
        tags: ['home-edit', 'unify'],
      },
    },
    {
      id: 'monochrome-dominant',
      appliesWhen: { type: 'colorCount', color: 'white', op: '>=', value: 10 },
      priority: 50,
      suggestion: {
        titleTemplate: '🤍 你有 {white} 件白色物品',
        bodyTemplate:
          '主導色集中是優勢 — 把這 {white} 件白色物品集中收在一個「白色區」，視覺極為純淨。其他顏色用彩虹排序襯托。「色塊集中」是 The Home Edit 的核心視覺語言。',
        tags: ['home-edit', 'color-zone'],
      },
    },
    {
      id: 'edit-before-aesthetic',
      appliesWhen: { type: 'frequencyCount', frequency: 'rarely', op: '>=', value: 10 },
      priority: 88,
      suggestion: {
        titleTemplate: '⚠️ 先 Edit，再 Aesthetic',
        bodyTemplate:
          'The Home Edit 的名字裡有 "Edit" — 先精選再美化。你有 {rarely} 件很少用的物品建議先處理 → 美化精選後的物品比美化雜亂物品有效十倍。',
        tags: ['home-edit', 'meta'],
      },
    },
    {
      id: 'low-diversity-noop',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'categoryCount', category: 'clothing', op: '>=', value: 10 },
          { type: 'colorDiversity', category: 'clothing', op: '<=', value: 3 },
        ],
      },
      priority: 30,
      suggestion: {
        titleTemplate: '色彩單一也美 — 黑白灰系列',
        bodyTemplate:
          '你的衣物色彩單一（≤ 3 色），彩虹分類發揮不大。改用「色深漸層」排序（淺 → 深）或「材質分區」（棉 / 麻 / 毛）— 一樣能達到視覺秩序。',
        tags: ['home-edit', 'low-diversity'],
      },
    },
    {
      id: 'label-everything',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 0 },
      priority: 40,
      suggestion: {
        titleTemplate: '🏷️ 標籤化是 Home Edit 的 DNA',
        bodyTemplate:
          '用標籤機（Brother PT-P300BT 約 2,000 元）把每個透明盒、每個層架都貼標。字體統一、大小一致。Amber Stash 的「標籤」tab 已內建可列印標籤功能，可直接出 PDF 給標籤紙列印。',
        tags: ['home-edit', 'labels'],
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: 'Edit 在前、Aesthetic 在後',
        bodyTemplate:
          'The Home Edit 不適合 0 → 1 階段。建議先用斷捨離 / KonMari 做完基礎減量，再切到 Home Edit 把成果視覺化。換到「斷捨離」或「怦然心動」方法論開始吧。',
      },
    },
  ],
  shoppingRules: [
    {
      id: 'clear-bins-multi',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 20 },
      pick: {
        nameTemplate: 'IKEA SAMLA / KUGGIS 透明收納盒系列（6+ 入）',
        reasonTemplate:
          'The Home Edit 的核心工具 — 同款不同尺寸，疊起來視覺立刻統一。',
        brand: 'IKEA',
        sku: 'SAMLA / KUGGIS',
        priceTwdMin: 79,
        priceTwdMax: 599,
      },
    },
    {
      id: 'labels-machine',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 30 },
      pick: {
        nameTemplate: 'Brother PT-P300BT 標籤機',
        reasonTemplate:
          '藍牙連手機列印標籤、字體 / 框線可自選。是長期投資 — 標籤化每個收納盒立即升級到 IG 級。',
        brand: 'Brother',
        sku: 'PT-P300BT',
        priceTwdMin: 1990,
        priceTwdMax: 2500,
      },
    },
    {
      id: 'acrylic-cosmetics',
      appliesWhen: { type: 'categoryCount', category: 'cosmetics', op: '>=', value: 10 },
      pick: {
        nameTemplate: '壓克力旋轉化妝品收納盤',
        reasonTemplate:
          '看得見每支口紅 / 粉底，旋轉拿取無死角。Costco / 蝦皮均有售。',
        priceTwdMin: 500,
        priceTwdMax: 1500,
      },
    },
    {
      id: 'unified-jars',
      appliesWhen: { type: 'categoryCount', category: 'kitchen', op: '>=', value: 8 },
      pick: {
        nameTemplate: '樂扣樂扣 Fresh Block / 天馬同系列密封罐 × 6',
        reasonTemplate:
          '乾貨統一裝進同款罐 → 廚房視覺立刻整齊。建議同形狀、可疊。',
        brand: '樂扣樂扣 / 天馬',
        priceTwdMin: 600,
        priceTwdMax: 1800,
      },
    },
  ],
  appliesTo: [
    'clothing',
    'kitchen',
    'books',
    'cosmetics',
    'toys',
    'other',
  ],
  pricing: { kind: 'free' },
  version: 1,
};
