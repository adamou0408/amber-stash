import type { Methodology } from '@/types/methodology';

/**
 * 怦然心動式 / KonMari（near-port of 近藤麻理惠方法）
 * 內建示範方法論 — v4 階段不對外授權。
 * 生命週期定位：deep-clean — 一次性大整理階段。
 */
export const KONMARI_METHODOLOGY: Methodology = {
  id: 'konmari-zh',
  authorId: 'placeholder-konmari',
  name: '怦然心動式',
  description:
    '按物品「種類」順序（衣物 → 書籍 → 文件 → 小物 → 紀念品）一次性大整理，留下會讓你怦然心動的物品。',
  language: 'zh-TW',
  systemPrompt:
    '你是「怦然心動」風格的收納顧問。引導使用者一件件拿起物品問「會讓你怦然心動嗎？」會的留下、不會的感謝後放手。語氣溫柔但堅定。按 5 種類別順序處理，不依房間。',
  lifecyclePhase: 'deep-clean',
  rules: [
    {
      id: 'order-clothing',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 1 },
      priority: 100,
      suggestion: {
        titleTemplate: '第 1 步：衣物（{clothing} 件）',
        bodyTemplate:
          '把所有衣物從家裡每個角落「全部拿出來」堆在床上 — 看到總量是第一步。一件一件拿起，問「會讓你怦然心動嗎？」會的留下，不會的感謝後放手。',
        tags: ['konmari', 'step-1', 'category-order'],
      },
    },
    {
      id: 'order-books',
      appliesWhen: { type: 'categoryCount', category: 'books', op: '>=', value: 1 },
      priority: 95,
      suggestion: {
        titleTemplate: '第 2 步：書籍（{books} 件）',
        bodyTemplate:
          '把所有書放到地上，不要在書櫃上挑。每本拿起來感受 — 留下「現在」會讓你心動的。「之後可能會看」通常代表現在不需要。',
        tags: ['konmari', 'step-2', 'category-order'],
      },
    },
    {
      id: 'order-documents',
      appliesWhen: { type: 'categoryCount', category: 'documents', op: '>=', value: 1 },
      priority: 90,
      suggestion: {
        titleTemplate: '第 3 步：文件（{documents} 件）',
        bodyTemplate:
          '文件原則上「全部丟」。只留三類：① 現在還在用、② 不確定要用一段時間、③ 法律或保固必須留。重要的掃描存雲端，紙本縮減。',
        tags: ['konmari', 'step-3', 'category-order'],
      },
    },
    {
      id: 'order-komono',
      appliesWhen: {
        type: 'or',
        conditions: [
          { type: 'categoryCount', category: 'cosmetics', op: '>=', value: 1 },
          { type: 'categoryCount', category: 'electronics', op: '>=', value: 1 },
          { type: 'categoryCount', category: 'tools', op: '>=', value: 1 },
          { type: 'categoryCount', category: 'kitchen', op: '>=', value: 1 },
        ],
      },
      priority: 85,
      suggestion: {
        titleTemplate: '第 4 步：小物（komono）',
        bodyTemplate:
          '小物範圍最廣：廚房、化妝品、電子配件、工具、雜物。依「對你現在生活有貢獻」逐件問。常用又心動 = 留；很少用且不心動 = 放手；很少用但心動 = 紀念區（極少數）。',
        tags: ['konmari', 'step-4', 'category-order'],
      },
    },
    {
      id: 'order-sentimental',
      appliesWhen: { type: 'categoryCount', category: 'sentimental', op: '>=', value: 1 },
      priority: 80,
      suggestion: {
        titleTemplate: '第 5 步：紀念品（{sentimental} 件）— 最後',
        bodyTemplate:
          '紀念品最難，承載過去感情。前面 4 步練習過了再來。一件件拿起問：「現在的我，需要這個物品嗎？」感謝後放手不是不珍惜，是珍惜過了。',
        tags: ['konmari', 'step-5', 'category-order'],
      },
    },
    {
      id: 'vertical-fold-tip',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 10 },
      priority: 60,
      suggestion: {
        titleTemplate: '直立摺疊法 · 衣物 {clothing} 件',
        bodyTemplate:
          '保留下來的衣物採「直立摺疊」收進抽屜 — 摺成 A4 紙大小的長方體立起來，像書本一樣一眼看到所有衣物，不會翻找凌亂。',
        tags: ['konmari', 'vertical-fold'],
      },
    },
    {
      id: 'color-group',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'categoryCount', category: 'clothing', op: '>=', value: 10 },
          { type: 'colorDiversity', category: 'clothing', op: '>=', value: 4 },
        ],
      },
      priority: 55,
      suggestion: {
        titleTemplate: '同色系收納 · 衣物 {colorVarieties} 種顏色',
        bodyTemplate:
          '掛衣服時依顏色排序（淺→深 / 暖→冷），視覺立刻整齊。搭配也更快 — 一眼看出今天有什麼顏色可選，避免重複買同色款。',
        tags: ['konmari', 'aesthetic-overlap'],
      },
    },
    {
      id: 'spark-joy-rarely',
      appliesWhen: { type: 'frequencyCount', frequency: 'rarely', op: '>=', value: 5 },
      priority: 75,
      suggestion: {
        titleTemplate: '❄️ {rarely} 件很少用的物品 — 練習感謝後放手',
        bodyTemplate:
          '一件件拿起每件 rarely 物品問「會讓你怦然心動嗎？」不會的話：「謝謝你曾經陪我」然後放手。物品的角色完成了，不必愧疚。',
        tags: ['konmari', 'principle-3'],
      },
    },
    {
      id: 'no-place-by-room',
      appliesWhen: { type: 'hasSpaceKind', kind: 'wardrobe' },
      priority: 10,
      suggestion: {
        titleTemplate: '⚠️ 不要按房間整理',
        bodyTemplate:
          'KonMari 核心：依「類別」而非「房間」。從各個房間蒐集同類別物品到一處再整理 — 才能看到總量、做心動篩選。一邊整理一邊清房間是混亂的開始。',
        tags: ['konmari', 'meta'],
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: '先想像「理想的生活」',
        bodyTemplate:
          'KonMari 第 0 步：閉眼想像 5 年後的理想生活 — 在哪、做什麼、家裡長怎樣？整理是工具，目的是那個生活。然後從衣物開始拍照建檔。',
      },
    },
  ],
  shoppingRules: [
    {
      id: 'no-buy-until-purged',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 0 },
      pick: {
        nameTemplate: '⚠️ 先別買收納用品',
        reasonTemplate:
          '怦然心動法的原則：先精簡，再收納。買盒子前先做完五類整理 — 你會發現需要的盒子比想像少很多。',
      },
    },
    {
      id: 'shoe-box-after',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'categoryCount', category: 'clothing', op: '>=', value: 15 },
          { type: 'frequencyCount', frequency: 'rarely', op: '<', value: 5 },
        ],
      },
      pick: {
        nameTemplate: '鞋盒（衣物分隔用）',
        reasonTemplate: '已完成減量階段。直立摺好的衣物用鞋盒當分隔最適合，免費取得 + 尺寸剛好。',
      },
    },
  ],
  appliesTo: ['clothing', 'books', 'documents', 'cosmetics', 'sentimental', 'other'],
  pricing: { kind: 'free' },
  version: 2,
};
